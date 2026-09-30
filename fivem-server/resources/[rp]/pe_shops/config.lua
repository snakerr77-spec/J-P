Config = {}

-- license = exige porte de arma (emitido por policial sargento+)
Config.Stock = {
    loja = { label = 'Loja 24h', blip = { 52, 2 }, items = {
        { item = 'agua', price = 6 }, { item = 'refri', price = 9 }, { item = 'sanduiche', price = 14 },
        { item = 'kit_medico', price = 350 }, { item = 'radio', price = 400 },
        { item = 'kit_reparo', price = 450 }, { item = 'weapon_bat', price = 250 }, { item = 'weapon_knife', price = 200 },
    } },
    armas = { label = 'Armas & Cia', blip = { 110, 1 }, items = {
        { item = 'weapon_pistol', price = 4500, license = true },
        { item = 'weapon_snspistol', price = 3200, license = true },
        { item = 'weapon_pumpshotgun', price = 9500, license = true },
        { item = 'municao', price = 180, license = true },
        { item = 'colete', price = 1800 },
    } },
}

Config.Shops = {
    { type = 'loja', coords = vec3(25.7, -1347.3, 29.5) }, { type = 'loja', coords = vec3(-47.4, -1757.5, 29.4) },
    { type = 'loja', coords = vec3(373.9, 326.9, 103.6) }, { type = 'loja', coords = vec3(2557.4, 382.3, 108.6) },
    { type = 'loja', coords = vec3(-3038.9, 585.9, 7.9) }, { type = 'loja', coords = vec3(-3241.9, 1001.5, 12.8) },
    { type = 'loja', coords = vec3(547.4, 2671.0, 42.2) }, { type = 'loja', coords = vec3(1961.4, 3740.7, 32.3) },
    { type = 'loja', coords = vec3(2678.9, 3280.7, 55.2) }, { type = 'loja', coords = vec3(1729.2, 6414.1, 35.0) },
    { type = 'loja', coords = vec3(1135.8, -982.3, 46.2) }, { type = 'loja', coords = vec3(-707.5, -914.3, 19.2) },
    { type = 'armas', coords = vec3(22.1, -1107.3, 29.8) }, { type = 'armas', coords = vec3(252.6, -50.0, 69.9) },
    { type = 'armas', coords = vec3(842.4, -1033.4, 28.2) }, { type = 'armas', coords = vec3(-662.1, -935.3, 21.8) },
    { type = 'armas', coords = vec3(-1305.5, -393.5, 36.7) }, { type = 'armas', coords = vec3(2567.7, 294.4, 108.7) },
    { type = 'armas', coords = vec3(1693.4, 3760.2, 34.7) }, { type = 'armas', coords = vec3(-330.2, 6083.9, 31.5) },
}
