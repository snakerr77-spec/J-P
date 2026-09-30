Config = {}

Config.Entry = vec3(-324.0, -1969.0, 21.6)      -- portal de entrada (Maze Bank Arena)
Config.Center = vec3(1150.0, -3130.0, 5.9)      -- centro da arena (Porto)
Config.Radius = 160.0
Config.Spawns = {
    vec4(1052.0, -3112.0, 5.9, 90.0), vec4(1120.0, -3150.0, 5.9, 0.0), vec4(1185.0, -3108.0, 5.9, 180.0),
    vec4(1230.0, -3180.0, 5.9, 270.0), vec4(1090.0, -3190.0, 5.9, 45.0), vec4(1150.0, -3080.0, 5.9, 200.0),
}
Config.RespawnDelay = 4000
Config.KillReward = 250
Config.StreakBonus = 50     -- por kill acima de 2 em sequência (máx 10)

Config.Loadouts = {
    { label = 'Fuzil de assalto', weapons = { 'WEAPON_ASSAULTRIFLE', 'WEAPON_PISTOL' } },
    { label = 'Submetralhadora', weapons = { 'WEAPON_SMG', 'WEAPON_PISTOL' } },
    { label = 'Espingarda', weapons = { 'WEAPON_PUMPSHOTGUN', 'WEAPON_PISTOL' } },
    { label = 'Sniper', weapons = { 'WEAPON_SNIPERRIFLE', 'WEAPON_COMBATPISTOL' } },
    { label = 'Só pistolas', weapons = { 'WEAPON_PISTOL50', 'WEAPON_COMBATPISTOL' } },
}
