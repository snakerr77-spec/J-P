import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Stethoscope } from 'lucide-react';
import { Icons } from '../icons';
import { ApiError, publicApi } from '../api';
import { formatPhoneBR } from '../phone';
import type { CandidateType, PublicApplicationView } from '../types';

type Props = { profileType: CandidateType };
type Stage = 'loading' | 'form' | 'success' | 'review';
type DocumentField = { name: string; type: string; label: string; hint: string };

const commonDocuments: DocumentField[] = [
  { name: 'cv', type: 'curriculo', label: 'Currículo profissional', hint: 'PDF, JPG ou PNG • até 10 MB por arquivo' },
  { name: 'photoId', type: 'documento_foto', label: 'Documento com foto', hint: 'RG, CNH ou equivalente' },
  { name: 'residence', type: 'comprovante_residencia', label: 'Comprovante de residência', hint: 'Arquivo recente' }
];

const medicalDocuments: DocumentField[] = [
  { name: 'crmCard', type: 'carteirinha_crm', label: 'Carteirinha CRM', hint: 'Frente ou arquivo digital' },
  { name: 'diplomas', type: 'diploma_certificado', label: 'Diploma e certificados', hint: 'Permite vários arquivos' },
  { name: 'practice', type: 'declaracao_atuacao', label: 'Declaração de atuação na área', hint: 'Comprovação de experiência/atuação' },
  { name: 'clearance', type: 'certidao_crm', label: 'Certidão Negativa', hint: 'Certidão ética / nada consta do CRM' }
];

const ACCEPT = 'application/pdf,.pdf,image/jpeg,image/png,.jpg,.jpeg,.png';

function storageKey(profileType: CandidateType) {
  return `jpApplicationToken_${profileType}`;
}

function readStoredToken(profileType: CandidateType): string | null {
  const fromHash = window.location.hash.split('/')[3];
  if (fromHash) return decodeURIComponent(fromHash);
  try { return localStorage.getItem(storageKey(profileType)); } catch { return null; }
}

function storeToken(profileType: CandidateType, token: string | null) {
  try {
    if (token) localStorage.setItem(storageKey(profileType), token);
    else localStorage.removeItem(storageKey(profileType));
  } catch { /* navegador sem armazenamento: segue só com o link */ }
}

function reviewLink(profileType: CandidateType, token: string) {
  return `${window.location.origin}${window.location.pathname}#/candidatura/${profileType}/${encodeURIComponent(token)}`;
}

function validateSelectedFiles(data: FormData, fields: DocumentField[]): string | null {
  for (const field of fields) {
    const files = data.getAll(field.name).filter(value => value instanceof File && value.size > 0) as File[];
    for (const file of files) {
      const allowed = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
      if (!allowed) return 'Envie apenas arquivos PDF, JPG ou PNG.';
      if (file.size > 10 * 1024 * 1024) return `O arquivo ${file.name} ultrapassa o limite de 10 MB.`;
    }
  }
  return null;
}

function UploadGrid({ fields, isDoctor, fileNames, sentByType, onPick }: {
  fields: DocumentField[];
  isDoctor: boolean;
  fileNames: Record<string, string>;
  sentByType?: Record<string, string[]>;
  onPick: (name: string, label: string) => void;
}) {
  return (
    <div className={`upload-grid ${isDoctor ? '' : 'collaborator-only'}`}>
      {fields.map(field => {
        const sent = sentByType?.[field.type] || [];
        const status = fileNames[field.name] || (sent.length ? `Enviado: ${sent.join(', ')}` : field.hint);
        return (
          <label className="upload-card" key={field.name}>
            <input name={field.name} type="file" multiple accept={ACCEPT} onChange={event => {
              const files = [...(event.target.files || [])];
              onPick(field.name, files.length === 1 ? files[0].name : files.length ? `${files.length} arquivos selecionados` : '');
            }}/>
            <span className="upload-icon">{sent.length && !fileNames[field.name] ? <Icons.Check size={19}/> : <Icons.Upload size={19}/>}</span>
            <span><strong>{field.label}</strong><small>{status}</small></span>
          </label>
        );
      })}
    </div>
  );
}

export default function ApplicationPage({ profileType }: Props) {
  const [stage, setStage] = useState<Stage>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [application, setApplication] = useState<PublicApplicationView | null>(null);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const isDoctor = profileType === 'medico';
  const documentFields = isDoctor ? [...commonDocuments, ...medicalDocuments] : [commonDocuments[0]];
  const pickFile = (name: string, label: string) => setFileNames(current => ({ ...current, [name]: label }));

  const openReview = async (reviewToken: string) => {
    const { application: data } = await publicApi.getApplication(reviewToken);
    setToken(reviewToken);
    setApplication(data);
    storeToken(profileType, reviewToken);
    setStage('review');
  };

  useEffect(() => {
    const saved = readStoredToken(profileType);
    if (!saved) { setStage('form'); return; }
    openReview(saved).catch(() => {
      storeToken(profileType, null);
      setStage('form');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileType]);

  const startNewApplication = () => {
    storeToken(profileType, null);
    setToken(null);
    setApplication(null);
    setFileNames({});
    setMessage('');
    setNotice('');
    if (window.location.hash.split('/')[3]) window.location.hash = `#/candidatura/${profileType}`;
    setStage('form');
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const requiredText = isDoctor
      ? ['name', 'email', 'phone', 'crm', 'specialty', 'availability']
      : ['name', 'email', 'phone', 'specialty', 'availability'];
    if (requiredText.some(key => !String(data.get(key) || '').trim())) {
      setMessage(isDoctor
        ? 'Preencha Nome, Especialidade, CRM, Telefone, E-mail e Disponibilidade.'
        : 'Preencha Nome, Cargo/Área, Telefone, E-mail e Disponibilidade.');
      return;
    }
    const fileError = validateSelectedFiles(data, documentFields);
    if (fileError) { setMessage(fileError); return; }

    setSubmitting(true);
    setMessage('');
    data.set('profileType', profileType);
    try {
      const { token: newToken } = await publicApi.submitApplication(data);
      storeToken(profileType, newToken);
      setToken(newToken);
      form.reset();
      setFileNames({});
      setStage('success');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Não foi possível enviar sua candidatura. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitDocuments = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !token) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const fileError = validateSelectedFiles(data, documentFields);
    if (fileError) { setMessage(fileError); return; }

    setSubmitting(true);
    setMessage('');
    setNotice('');
    try {
      const { uploaded } = await publicApi.uploadDocuments(token, data);
      form.reset();
      setFileNames({});
      const { application: refreshed } = await publicApi.getApplication(token);
      setApplication(refreshed);
      setNotice(`${uploaded} arquivo(s) enviado(s) e salvo(s) na sua candidatura.`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Não foi possível enviar os anexos. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!token) return;
    try { await navigator.clipboard.writeText(reviewLink(profileType, token)); setCopied(true); } catch { setCopied(false); }
  };

  const sentByType = (application?.documents || []).reduce<Record<string, string[]>>((acc, doc) => {
    (acc[doc.type] ||= []).push(doc.name);
    return acc;
  }, {});

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
          {stage === 'loading' && <div className="application-form-title"><p>Carregando...</p></div>}

          {stage === 'form' && (
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
                <div className="document-section-title"><span>{isDoctor ? 'DOCUMENTOS' : 'CURRÍCULO'}</span><h3>{isDoctor ? 'Documentação médica' : 'Currículo profissional'}</h3><p>PDF, JPG ou PNG, até 10 MB por arquivo. Os anexos são opcionais agora — você pode enviar depois, voltando por este mesmo link.</p></div>
                <UploadGrid fields={documentFields} isDoctor={isDoctor} fileNames={fileNames} onPick={pickFile}/>
                {message && <div className="application-error">{message}</div>}
                <button className="application-submit" type="submit" disabled={submitting}>{submitting ? 'Enviando candidatura...' : 'Enviar candidatura'}</button>
              </form>
            </>
          )}

          {stage === 'success' && token && (
            <section className="application-success">
              <span className="success-icon"><Icons.Check size={34}/></span>
              <small>CANDIDATURA ENVIADA</small>
              <h2>Recebemos sua candidatura.</h2>
              <p>As informações foram registradas no processo de {isDoctor ? 'recrutamento médico' : 'recrutamento de colaboradores'}. Se faltou algum documento, você pode revisar e enviar depois — neste navegador é só abrir este mesmo link de novo. Em outro aparelho, use o link abaixo:</p>
              <p><code>{reviewLink(profileType, token)}</code></p>
              <button className="button button-ghost" type="button" onClick={copyLink}>{copied ? 'Link copiado' : 'Copiar link de revisão'}</button>
              <button className="button button-primary" type="button" onClick={() => openReview(token).catch(() => setStage('form'))}>Revisar dados enviados</button>
              <button className="button button-ghost" type="button" onClick={startNewApplication}>Enviar outra candidatura</button>
            </section>
          )}

          {stage === 'review' && application && (
            <>
              <div className="application-form-title"><span>REVISAR CANDIDATURA</span><h2>Dados enviados</h2><p>Confira as informações que você enviou. Se faltou algum documento, anexe abaixo — ele fica salvo nesta mesma candidatura.</p></div>
              <div className="public-application-form">
                <div className="public-form-grid">
                  <label>Nome completo<input value={application.name} readOnly/></label>
                  <label>E-mail<input value={application.email} readOnly/></label>
                  <label>Telefone<input value={application.phone} readOnly/></label>
                  <label>Cidade<input value={application.city} readOnly/></label>
                  <label>{isDoctor ? 'Especialidade' : 'Cargo / área de interesse'}<input value={application.specialty} readOnly/></label>
                  {isDoctor && <label>CRM<input value={application.crm} readOnly/></label>}
                  {isDoctor && <label>RQE<input value={application.rqe} readOnly/></label>}
                  <label>Experiência<input value={application.experience} readOnly/></label>
                  <label className="span-2">Disponibilidade<input value={application.availability} readOnly/></label>
                </div>
              </div>
              <form className="public-application-form" onSubmit={submitDocuments}>
                <div className="document-section-title"><span>{isDoctor ? 'DOCUMENTOS' : 'CURRÍCULO'}</span><h3>Anexos da candidatura</h3><p>Itens com ✓ já foram recebidos. Selecione os arquivos que faltam (ou novos) e clique em enviar.</p></div>
                <UploadGrid fields={documentFields} isDoctor={isDoctor} fileNames={fileNames} sentByType={sentByType} onPick={pickFile}/>
                {message && <div className="application-error">{message}</div>}
                {notice && <div className="application-error" style={{ color: '#1f6b46', background: '#e8f6ee' }}>{notice}</div>}
                <button className="application-submit" type="submit" disabled={submitting}>{submitting ? 'Enviando anexos...' : 'Enviar anexos'}</button>
              </form>
              <button className="button button-ghost" type="button" style={{ marginTop: 12 }} onClick={startNewApplication}>Enviar outra candidatura</button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
