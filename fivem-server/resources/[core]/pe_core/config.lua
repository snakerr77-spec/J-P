Config = {}

Config.ServerName   = 'Porto Esmeralda'
Config.StartCash    = 1500
Config.StartBank    = 5000
Config.Spawn        = vec4(-1037.0, -2737.0, 20.17, 328.0) -- aeroporto internacional
Config.PayInterval  = 10   -- minutos entre salários
Config.UnemployedPay = 150
Config.NeedsEnabled = true -- fome e sede

-- Personagens disponíveis (/personagem)
Config.Models = {
    { 'a_m_y_hipster_01', 'Homem - Hipster' }, { 'a_m_y_skater_01', 'Homem - Skatista' },
    { 'a_m_y_vinewood_01', 'Homem - Vinewood' }, { 'a_m_y_stbla_01', 'Homem - Rua' },
    { 'a_m_y_soucent_01', 'Homem - Sul' }, { 'a_m_y_busicas_01', 'Homem - Executivo' },
    { 'a_m_m_business_01', 'Homem - Terno' }, { 'a_m_y_genstreet_01', 'Homem - Casual' },
    { 'a_f_y_hipster_01', 'Mulher - Hipster' }, { 'a_f_y_beach_01', 'Mulher - Praia' },
    { 'a_f_y_business_01', 'Mulher - Executiva' }, { 'a_f_y_tourist_01', 'Mulher - Turista' },
    { 'a_f_y_vinewood_01', 'Mulher - Vinewood' }, { 'a_f_y_skater_01', 'Mulher - Skatista' },
    { 'a_f_y_fitness_01', 'Mulher - Fitness' }, { 'a_f_y_eastsa_01', 'Mulher - Leste' },
}

-- Itens. food = efeito; weapon = arma equipada ao usar; jobOnly = some ao sair de serviço;
-- illegal = pode ser apreendido pela polícia.
Config.Items = {
    agua          = { label = 'Água', food = { thirst = 35 } },
    refri         = { label = 'Refrigerante', food = { thirst = 25, hunger = 5 } },
    sanduiche     = { label = 'Sanduíche', food = { hunger = 35 } },
    kit_medico    = { label = 'Kit médico', event = 'pe:client:heal' },
    colete        = { label = 'Colete balístico', event = 'pe:client:armor' },
    kit_reparo    = { label = 'Kit de reparo', event = 'pe:client:repairKit' },
    algemas       = { label = 'Algemas' },
    radio         = { label = 'Rádio' },
    municao       = { label = 'Caixa de munição', ammo = 50 },

    -- crime
    dinheiro_sujo = { label = 'Dinheiro sujo', illegal = true },
    explosivo     = { label = 'Explosivo C4', illegal = true },
    folha_coca    = { label = 'Folha de coca', illegal = true },
    pasta_base    = { label = 'Pasta base', illegal = true },
    cocaina       = { label = 'Cocaína', illegal = true },
    folha_maconha = { label = 'Folha de maconha', illegal = true },
    maconha       = { label = 'Maconha prensada', illegal = true },

    -- armas civis (exigem porte para comprar em loja)
    weapon_pistol       = { label = 'Pistola 9mm', weapon = 'WEAPON_PISTOL' },
    weapon_snspistol    = { label = 'Pistola compacta', weapon = 'WEAPON_SNSPISTOL' },
    weapon_pumpshotgun  = { label = 'Espingarda calibre 12', weapon = 'WEAPON_PUMPSHOTGUN' },
    weapon_bat          = { label = 'Taco de beisebol', weapon = 'WEAPON_BAT' },
    weapon_knife        = { label = 'Faca', weapon = 'WEAPON_KNIFE' },
    -- armas de mercado negro
    weapon_microsmg     = { label = 'Micro SMG', weapon = 'WEAPON_MICROSMG', illegal = true },
    weapon_assaultrifle = { label = 'Fuzil de assalto', weapon = 'WEAPON_ASSAULTRIFLE', illegal = true },
    weapon_machete      = { label = 'Machete', weapon = 'WEAPON_MACHETE' },
    -- equipamento da polícia (devolvido ao sair de serviço)
    weapon_stungun      = { label = 'Taser', weapon = 'WEAPON_STUNGUN', jobOnly = 'policia' },
    weapon_nightstick   = { label = 'Cassetete', weapon = 'WEAPON_NIGHTSTICK', jobOnly = 'policia' },
    pm_pistola          = { label = 'Pistola PM', weapon = 'WEAPON_COMBATPISTOL', jobOnly = 'policia' },
    pm_escopeta         = { label = 'Escopeta PM', weapon = 'WEAPON_PUMPSHOTGUN', jobOnly = 'policia' },
    pm_fuzil            = { label = 'Fuzil PM', weapon = 'WEAPON_CARBINERIFLE', jobOnly = 'policia' },
    pm_submetralhadora  = { label = 'Submetralhadora PM', weapon = 'WEAPON_SMG', jobOnly = 'policia' },
}

-- duty = precisa entrar/sair de serviço (só recebe salário em serviço)
-- whitelist = só por contratação do chefe/admin; boss = grade mínimo que contrata/demite
Config.Jobs = {
    desempregado = { label = 'Desempregado', grades = { [0] = { label = 'Civil', pay = 0 } } },
    policia = { label = 'Polícia Militar', whitelist = true, duty = true, boss = 4, grades = {
        [0] = { label = 'Cadete', pay = 450 }, [1] = { label = 'Soldado', pay = 650 },
        [2] = { label = 'Sargento', pay = 850 }, [3] = { label = 'Tenente', pay = 1100 },
        [4] = { label = 'Comandante', pay = 1400 } } },
    ems = { label = 'Paramédico', whitelist = true, duty = true, boss = 3, grades = {
        [0] = { label = 'Estagiário', pay = 400 }, [1] = { label = 'Socorrista', pay = 650 },
        [2] = { label = 'Médico', pay = 950 }, [3] = { label = 'Diretor', pay = 1300 } } },
    mecanico = { label = 'Mecânico', duty = true, boss = 2, grades = {
        [0] = { label = 'Aprendiz', pay = 0 }, [1] = { label = 'Mecânico', pay = 0 },
        [2] = { label = 'Dono da oficina', pay = 0 } } },
    taxista = { label = 'Taxista', grades = { [0] = { label = 'Motorista', pay = 0 } } },
    entregador = { label = 'Entregador', grades = { [0] = { label = 'Entregador', pay = 0 } } },
}
