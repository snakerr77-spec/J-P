Config = {}

-- Catálogo. Cada concessionária vende as categorias listadas em `categories`.
Config.Catalog = {
    compactos = { label = 'Compactos', cars = {
        { 'blista', 'Blista', 18000 }, { 'issi2', 'Issi', 15000 }, { 'panto', 'Panto', 9000 },
        { 'prairie', 'Prairie', 16000 }, { 'brioso', 'Brioso R/A', 21000 } } },
    sedans = { label = 'Sedãs', cars = {
        { 'asea', 'Asea', 22000 }, { 'premier', 'Premier', 25000 }, { 'fugitive', 'Fugitive', 38000 },
        { 'washington', 'Washington', 32000 }, { 'tailgater', 'Tailgater', 55000 } } },
    muscle = { label = 'Muscle', cars = {
        { 'vigero', 'Vigero', 42000 }, { 'sabregt', 'Sabre Turbo', 52000 }, { 'gauntlet', 'Gauntlet', 60000 },
        { 'dominator', 'Dominator', 75000 } } },
    esportivos = { label = 'Esportivos', cars = {
        { 'futo', 'Futo', 34000 }, { 'sultan', 'Sultan', 58000 }, { 'elegy2', 'Elegy Retro', 90000 },
        { 'jester', 'Jester', 135000 }, { 'massacro', 'Massacro', 150000 }, { 'carbonizzare', 'Carbonizzare', 170000 } } },
    suvs = { label = 'SUVs', cars = {
        { 'baller', 'Baller', 70000 }, { 'granger', 'Granger', 62000 }, { 'landstalker', 'Landstalker', 58000 },
        { 'cavalcade', 'Cavalcade', 66000 }, { 'patriot', 'Patriot', 80000 } } },
    motos = { label = 'Motos', cars = {
        { 'faggio', 'Faggio', 4500 }, { 'sanchez', 'Sanchez', 14000 }, { 'pcj', 'PCJ 600', 22000 },
        { 'double', 'Double-T', 65000 }, { 'bati', 'Bati 801', 70000 }, { 'vader', 'Vader', 30000 } } },
    utilitarios = { label = 'Utilitários', cars = {
        { 'bison', 'Bison', 30000 }, { 'sadler', 'Sadler', 28000 }, { 'rebel', 'Rebel', 25000 }, { 'speedo', 'Speedo', 27000 } } },
    super = { label = 'Super esportivos', cars = {
        { 'adder', 'Adder', 450000 }, { 'zentorno', 'Zentorno', 520000 }, { 'entityxf', 'Entity XF', 480000 } } },
    blindados = { label = 'Blindados', cars = {
        { 'baller5', 'Baller LE Blindado', 330000 }, { 'baller6', 'Baller LE LWB Blindado', 360000 },
        { 'schafter5', 'Schafter V12 Blindado', 290000 }, { 'schafter6', 'Schafter LWB Blindado', 310000 },
        { 'kuruma2', 'Kuruma Blindado', 420000 }, { 'xls2', 'XLS Blindado', 380000 },
        { 'nightshark', 'HVY Nightshark', 950000 } } },
}

Config.Dealers = {
    { name = 'Concessionária PDM', coords = vec3(-56.8, -1098.6, 26.42), spawn = vec4(-47.5, -1083.0, 26.3, 70.0),
      categories = { 'compactos', 'sedans', 'muscle', 'esportivos', 'suvs', 'motos', 'utilitarios', 'super' }, blip = { 326, 3 } },
    { name = 'Blindados Esmeralda', coords = vec3(-1616.0, -1014.0, 13.05), spawn = vec4(-1610.0, -1005.0, 13.0, 50.0),
      categories = { 'blindados' }, blip = { 326, 1 } },
}

Config.Garages = {
    { name = 'Garagem Legion Square', coords = vec3(215.8, -810.0, 30.7), spawn = vec4(222.0, -804.0, 30.6, 250.0) },
    { name = 'Garagem Vespucci', coords = vec3(-1184.4, -1509.2, 4.4), spawn = vec4(-1180.0, -1500.0, 4.4, 300.0) },
    { name = 'Garagem Sandy Shores', coords = vec3(1737.0, 3710.0, 34.1), spawn = vec4(1730.0, 3715.0, 34.1, 20.0) },
    { name = 'Garagem Paleto Bay', coords = vec3(-105.0, 6325.0, 31.6), spawn = vec4(-98.0, 6330.0, 31.5, 135.0) },
}
Config.ImpoundFee = 250 -- veículo deixado na rua

-- Oficinas (tuning). Preço por nível; mecânico em serviço tem desconto.
Config.Workshops = {
    vec3(-337.0, -136.5, 39.0), vec3(731.0, -1088.8, 22.2), vec3(-1155.0, -2007.0, 13.2),
    vec3(1175.0, 2640.0, 37.8), vec3(110.0, 6626.0, 31.8),
}
Config.MechanicDiscount = 0.3
Config.Tuning = {
    { id = 'motor', label = 'Motor', mod = 11, prices = { 6000, 14000, 28000, 50000 } },
    { id = 'freios', label = 'Freios', mod = 12, prices = { 3000, 7000, 12000 } },
    { id = 'cambio', label = 'Transmissão', mod = 13, prices = { 4000, 9000, 16000 } },
    { id = 'suspensao', label = 'Suspensão', mod = 15, prices = { 2500, 5000, 8000, 12000 } },
    { id = 'blindagem', label = 'Blindagem', mod = 16, prices = { 25000, 45000, 70000, 100000, 150000 } },
    { id = 'turbo', label = 'Turbo', mod = 18, toggle = true, prices = { 30000 } },
    { id = 'pneus', label = 'Pneus à prova de bala', special = 'bulletproof', prices = { 12000 } },
}
Config.Colors = { { 'Preto', 0 }, { 'Branco', 111 }, { 'Vermelho', 27 }, { 'Azul', 64 }, { 'Verde', 53 }, { 'Amarelo', 88 },
    { 'Laranja', 38 }, { 'Cinza', 4 }, { 'Rosa', 135 } }
Config.PaintPrice = 1500
Config.RepairPrice = 500
