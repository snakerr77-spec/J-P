Config = {}

Config.MaxFine = 50000
Config.MaxJail = 120        -- minutos
Config.LicenseGrade = 2     -- grade mínimo para emitir porte de arma
Config.ShotCooldown = 60    -- segundos entre alertas de tiros
Config.NoShotAlert = {      -- onde tiros NÃO chamam a polícia (favela)
    { center = vec3(100.0, -1950.0, 20.8), radius = 170.0 },
}

Config.Stations = {
    { name = 'Delegacia Central (Mission Row)', blip = true,
      locker = vec3(452.3, -980.0, 30.69), garage = vec3(454.7, -1017.2, 28.45),
      spawn = vec4(447.9, -1025.5, 28.6, 0.0), heli = vec4(449.2, -981.3, 43.7, 90.0) },
    { name = 'Delegacia de Sandy Shores', blip = true,
      locker = vec3(1853.0, 3689.0, 34.27), garage = vec3(1859.0, 3700.0, 33.4),
      spawn = vec4(1868.0, 3708.0, 33.4, 210.0) },
    { name = 'Delegacia de Paleto Bay', blip = true,
      locker = vec3(-449.0, 6013.0, 31.72), garage = vec3(-476.0, 6020.0, 31.3),
      spawn = vec4(-470.0, 6030.0, 31.3, 225.0) },
}

-- grade = grade mínimo; max = quantidade máxima que pode ter
Config.Armory = {
    { item = 'weapon_stungun', grade = 0, max = 1 }, { item = 'weapon_nightstick', grade = 0, max = 1 },
    { item = 'pm_pistola', grade = 0, max = 1 }, { item = 'algemas', grade = 0, max = 2 },
    { item = 'radio', grade = 0, max = 1 }, { item = 'colete', grade = 0, max = 3 },
    { item = 'kit_medico', grade = 0, max = 5 }, { item = 'municao', grade = 0, max = 5 },
    { item = 'pm_escopeta', grade = 2, max = 1 }, { item = 'pm_fuzil', grade = 2, max = 1 },
    { item = 'pm_submetralhadora', grade = 3, max = 1 },
}

-- viaturas (blindadas: riot, riot2, fbi2)
Config.Vehicles = {
    { model = 'police', label = 'Viatura patrulha', grade = 0 },
    { model = 'police2', label = 'Viatura Buffalo', grade = 0 },
    { model = 'police3', label = 'Viatura Interceptor', grade = 1 },
    { model = 'policeb', label = 'Moto patrulha', grade = 0 },
    { model = 'policet', label = 'Van de transporte', grade = 1 },
    { model = 'sheriff', label = 'Viatura SUV', grade = 1 },
    { model = 'fbi', label = 'Viatura descaracterizada', grade = 2 },
    { model = 'fbi2', label = 'SUV tática (blindada)', grade = 2 },
    { model = 'riot', label = 'Blindado de choque (Riot)', grade = 3 },
    { model = 'riot2', label = 'Blindado RCV', grade = 4 },
}

Config.Jail = {
    center = vec3(1690.0, 2570.0, 45.56), radius = 110.0,
    cells = { vec4(1691.2, 2565.3, 45.56, 180.0), vec4(1700.5, 2560.0, 45.56, 90.0), vec4(1680.0, 2575.0, 45.56, 270.0) },
    release = vec4(1849.0, 2590.0, 45.7, 270.0),
}

Config.Props = { cone = `prop_roadcone02a`, barreira = `prop_barrier_work06a` }
