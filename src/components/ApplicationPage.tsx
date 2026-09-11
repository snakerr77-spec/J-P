import { useState } from 'react';
import { BriefcaseBusiness, Stethoscope } from 'lucide-react';
import { Icons } from '../icons';
import { loadCandidates, normalizeCandidate, saveCandidateDocument, saveCandidates, initialsFromName } from '../storage';
import { formatPhoneBR } from '../phone';
import type { CandidateType } from '../types';

type Props = { profileType: CandidateType };

type DocumentField = { name: string; type: string; label: string; hint: string; required?: boolean };

const commonDocuments: DocumentField[] = [
  { name: 'cv', type: 'curriculo', label: 'Currículo profissional', hint: 'PDF, JPG ou PNG • até 10 MB por arquivo', required: true },
  { name: 'photoId', type: 'documento_foto', label: 'Documento com foto', hint: 'RG, CNH ou equivalente', required: true },
  { name: 'residence', type: 'comprovante_residencia', label: 'Comprovante de residência', hint: 'Arquivo recente', required: true }
];

const medicalDocuments: DocumentField[] = [
  { name: 'crmCard', type: 'carteirinha_crm', label: 'Carteirinha CRM', hint: 'Frente ou arquivo digital', required: true },
  { name: 'diplomas', type: 'diploma_certificado', label: 'Diploma e certificados', hint: 'Permite vários arquivos', required: true },
  { name: 'practice', type: 'declaracao_atuacao', label: 'Declaração de atuação na área', hint: 'Comprovação de experiência/atuação', required: true },
  { name: 'clearance', type: 'certidao_crm', label: 'Certidão Negativa', hint: 'Certidão ética / nada consta do CRM', required: true }
];

export default function ApplicationPage({ profileType }: Props) {
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});

  const documentFields = profileType === 'medico'
    ? [...commonDocuments, ...medicalDocuments]
    : [commonDocuments[0]];

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const requiredText = profileType === 'medico'
      ? ['name', 'email', 'phone', 'crm', 'specialty', 'availability']
      : ['name', 'email', 'phone', 'specialty', 'availability'];
    if (requiredText.some(key => !String(data.get(key) || '').trim())) {
      setMessage(profileType === 'medico'
        ? 'Preencha Nome, Especialidade, CRM, Telefone, E-mail e Disponibilidade.'
        : 'Preencha Nome, Cargo/Área, Telefone, E-mail e Disponibilidade.');
      return;
    }

    for (const field of documentFields) {
      const files = data.getAll(field.name).filter(value => value instanceof File && value.size > 0) as File[];
      if (field.required && !files.length) {
        setMessage(`Anexe ${field.label} para continuar.`);
        return;
      }
      for (const file of files) {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
        if (!allowed) { setMessage('Envie apenas arquivos PDF, JPG ou PNG.'); return; }
        if (file.size > 10 * 1024 * 1024) { setMessage(`O arquivo ${file.name} ultrapassa o limite de 10 MB.`); return; }
      }
    }

    setSubmitting(true);
    setMessage('');
    const id = Date.now();
    const documents = [];
    try {
      for (const field of documentFields) {
        const files = data.getAll(field.name).filter(value => value instanceof File && value.size > 0) as File[];
        for (let index = 0; index < files.length; index++) {
          documents.push(await saveCandidateDocument(id, field.type, field.label, files[index], index));
        }
      }
      const name = String(data.get('name') || '').trim();
      const availability = String(data.get('availability') || '').trim();
      const summary = String(data.get('summary') || '').trim();
      const candidate = normalizeCandidate({
        id,
        profileType,
        name,
        initials: initialsFromName(name),
        specialty: String(data.get('specialty') || '').trim() || (profileType === 'medico' ? 'Especialidade não informada' : 'Área não informada'),
        city: String(data.get('city') || '').trim() || 'Cidade não informada',
        crm: profileType === 'medico' ? String(data.get('crm') || '').trim() : 'Não se aplica',
        rqe: profileType === 'medico' ? String(data.get('rqe') || '').trim() || 'Não informado' : 'Não se aplica',
        status: 'novo',
        statusLabel: 'Novo',
        email: String(data.get('email') || '').trim(),
        phone: formatPhoneBR(String(data.get('phone') || '')),
        experience: String(data.get('experience') || '').trim() || 'Não informado',
        availability,
        createdAt: new Date().toISOString(),
        documents,
        notes: `${documents.length} documento(s) anexado(s) na candidatura de ${profileType === 'medico' ? 'médico' : 'colaborador'}.`,
        curriculum: [summary || 'Resumo profissional não informado.', `Disponibilidade: ${availability}.`, `${documents.length} documento(s) anexado(s).`]
      });
      const candidates = loadCandidates();
      saveCandidates([candidate, ...candidates]);
      form.reset();
      setFileNames({});
      setSuccess(true);
    } catch {
      setMessage('Não foi possível salvar um dos documentos neste navegador. Tente arquivos menores ou outro navegador.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDoctor = profileType === 'medico';

  return (
    <div className="application-page">
      <aside className="application-story">
        <div className="application-photo" style={{ backgroundImage: "url('./assets/login-clinic-bg-blue.jpg')" }} />
        <video className="application-leaves" autoPlay muted loop playsInline><source src="./assets/leaves-overlay-blue.webm" type="video/webm"/></video>
        <div className="application-overlay" />
        <div className="application-story-content">
          <div className="application-brand static"><img src="./assets/jp-logo-horizontal.png" alt="J&P Serviços Médicos"/><span>Recrutamento J&amp;P</span></div>
          <div className="application-story-copy">
            <small>OPORTUNIDADE PROFISSIONAL</small>
            <h1>{isDoctor ? 'Faça parte da nossa rede médica.' : 'Construa sua carreira com a J&P.'}</h1>
            <p>{isDoctor ? 'Cadastre sua experiência, especialidade e registros profissionais para novas oportunidades médicas.' : 'Cadastre seu perfil para oportunidades administrativas, operacionais e de atendimento.'}</p>
            <div className="application-features">
              <article>{isDoctor ? <Stethoscope size={20}/> : <BriefcaseBusiness size={20}/>}<div><strong>{isDoctor ? 'Perfil médico' : 'Perfil de colaborador'}</strong><span>{isDoctor ? 'CRM, RQE, especialidade e experiência.' : 'Cargo, área de interesse e experiência profissional.'}</span></div></article>
              <article><Icons.File size={20}/><div><strong>Currículo profissional</strong><span>Centralize as informações da sua carreira.</span></div></article>
              <article><Icons.ShieldCheck size={20}/><div><strong>Processo seguro</strong><span>Dados organizados para avaliação interna.</span></div></article>
            </div>
          </div>
          <small className="application-footer">Portal profissional de recrutamento • {isDoctor ? 'Candidatura médica' : 'Candidatura de colaborador'}</small>
        </div>
      </aside>
      <main className="application-form-panel">
        <div className="application-form-wrap">
          {!success ? (
            <>
              <div className={`application-fixed-profile ${isDoctor ? 'doctor' : 'collaborator'}`}>{isDoctor ? <Stethoscope size={18}/> : <BriefcaseBusiness size={18}/>}<div><small>FORMULÁRIO EXCLUSIVO</small><strong>{isDoctor ? 'Candidatura médica' : 'Candidatura de colaborador'}</strong><span>{isDoctor ? 'Este link recebe apenas perfis médicos.' : 'Este link recebe apenas perfis administrativos e operacionais.'}</span></div></div>
              <div className="application-form-title"><span>{isDoctor ? 'CANDIDATURA MÉDICA' : 'CANDIDATURA DE COLABORADOR'}</span><h2>Dados profissionais</h2><p>Preencha as informações abaixo. Este formulário é exclusivo para {isDoctor ? 'médicos' : 'colaboradores'} e não exibe dados internos da J&amp;P.</p></div>
              <form className="public-application-form" onSubmit={submit}>
                <div className="public-form-grid">
                  <label>Nome completo *<input name="name" required placeholder={isDoctor ? 'Ex.: Dra. Mariana Costa' : 'Ex.: Juliana Martins'}/></label>
                  <label>E-mail *<input name="email" type="email" required placeholder="email@exemplo.com"/></label>
                  <label>Telefone *<input name="phone" required inputMode="tel" maxLength={15} placeholder="(__) _____-____" onInput={event => { event.currentTarget.value = formatPhoneBR(event.currentTarget.value); }}/></label>
                  <label>Cidade<input name="city" placeholder="Ex.: Cerquilho"/></label>
                  <label>{isDoctor ? 'Especialidade *' : 'Cargo / área de interesse *'}<input name="specialty" required placeholder={isDoctor ? 'Ex.: Cardiologia' : 'Ex.: Recepção / Atendimento'}/></label>
                  {isDoctor && <label>CRM *<input name="crm" required placeholder="Ex.: CRM/SP 123456"/></label>}
                  {isDoctor && <label>RQE<input name="rqe" placeholder="Ex.: RQE 55190"/></label>}
                  <label>Experiência<input name="experience" placeholder={isDoctor ? 'Ex.: 8 anos' : 'Ex.: 3 anos em atendimento'}/></label>
                  <label className="span-2">Disponibilidade *<input name="availability" required placeholder="Ex.: Seg a Sex • Tarde"/></label>
                  <label className="span-2">Resumo profissional<textarea name="summary" rows={4} placeholder="Conte um pouco sobre sua atuação e experiência."/></label>
                </div>
                <div className="document-section-title"><span>{isDoctor ? 'DOCUMENTOS' : 'CURRÍCULO'}</span><h3>{isDoctor ? 'Documentação médica' : 'Currículo profissional'}</h3><p>{isDoctor ? 'PDF, JPG ou PNG. Limite de 10 MB por arquivo. Itens marcados com * são obrigatórios.' : 'Envie somente o seu currículo profissional. PDF, JPG ou PNG, com limite de 10 MB.'}</p></div>
                <div className={`upload-grid ${isDoctor ? '' : 'collaborator-only'}`}>
                  {documentFields.map(field => (
                    <label className="upload-card" key={field.name}>
                      <input name={field.name} type="file" multiple required={field.required} accept="application/pdf,.pdf,image/jpeg,image/png,.jpg,.jpeg,.png" onChange={event => {
                        const files = [...(event.target.files || [])];
                        setFileNames(current => ({ ...current, [field.name]: files.length === 1 ? files[0].name : files.length ? `${files.length} arquivos selecionados` : '' }));
                      }}/>
                      <span className="upload-icon"><Icons.Upload size={19}/></span>
                      <span><strong>{field.label}{field.required ? ' *' : ''}</strong><small>{fileNames[field.name] || field.hint}</small></span>
                    </label>
                  ))}
                </div>
                {message && <div className="application-error">{message}</div>}
                <button className="application-submit" type="submit" disabled={submitting}>{submitting ? 'Enviando currículo...' : 'Enviar currículo'}</button>
              </form>
            </>
          ) : (
            <section className="application-success"><span className="success-icon"><Icons.Check size={34}/></span><small>CURRÍCULO ENVIADO</small><h2>Recebemos seu currículo.</h2><p>As informações foram registradas no processo de {isDoctor ? 'recrutamento médico' : 'recrutamento de colaboradores'} para avaliação da equipe J&amp;P.</p><button className="button button-primary" onClick={() => setSuccess(false)}>Enviar outro currículo</button></section>
          )}
        </div>
      </main>
    </div>
  );
}
