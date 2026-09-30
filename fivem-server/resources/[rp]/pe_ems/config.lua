Config = {}

Config.BleedoutSeconds = 300   -- tempo até poder renascer
Config.RespawnAfter = 120      -- segundos mínimos antes de poder renascer no hospital
Config.RespawnFee = 500
Config.HealFee = 300           -- atendimento na recepção

Config.Hospitals = {
    { name = 'Hospital Pillbox', blip = true, locker = vec3(311.2, -599.0, 43.29), reception = vec3(308.0, -595.0, 43.28),
      bed = vec4(298.0, -584.4, 43.26, 70.0), garage = vec3(335.0, -564.0, 28.74), spawn = vec4(338.5, -558.5, 28.74, 340.0) },
    { name = 'Hospital de Sandy Shores', blip = true, locker = vec3(1839.0, 3672.0, 34.3), reception = vec3(1835.0, 3676.0, 34.3),
      bed = vec4(1836.0, 3670.0, 34.3, 210.0), garage = vec3(1830.0, 3690.0, 34.2), spawn = vec4(1826.0, 3693.0, 34.2, 210.0) },
    { name = 'Hospital de Paleto Bay', blip = true, locker = vec3(-247.0, 6331.0, 32.4), reception = vec3(-250.0, 6335.0, 32.4),
      bed = vec4(-254.0, 6326.0, 32.4, 45.0), garage = vec3(-240.0, 6340.0, 32.3), spawn = vec4(-233.0, 6347.0, 32.3, 225.0) },
}

Config.Vehicles = {
    { model = 'ambulance', label = 'Ambulância', grade = 0 },
    { model = 'firetruk', label = 'Caminhão de bombeiros', grade = 1 },
}
Config.Armory = { { item = 'kit_medico', max = 10 }, { item = 'radio', max = 1 }, { item = 'colete', max = 2 } }
