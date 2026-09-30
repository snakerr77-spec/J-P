Config = {}

Config.Zone = { name = 'Morro do Corvo', center = vec3(100.0, -1950.0, 20.8), radius = 170.0 }

-- pontos de colheita (plantações fora da cidade)
Config.Fields = {
    { item = 'folha_coca', label = 'Colher folha de coca', coords = vec3(2433.0, 4969.0, 42.3), min = 1, max = 3 },
    { item = 'folha_maconha', label = 'Colher maconha', coords = vec3(2050.0, 4955.0, 41.0), min = 1, max = 3 },
}

-- laboratório dentro da favela
Config.Lab = vec3(112.0, -1960.0, 20.8)
Config.Recipes = {
    { id = 'pasta', label = 'Refinar pasta base', from = 'folha_coca', need = 3, to = 'pasta_base', give = 1, ms = 6000 },
    { id = 'cocaina', label = 'Cristalizar cocaína', from = 'pasta_base', need = 2, to = 'cocaina', give = 1, ms = 7000 },
    { id = 'maconha', label = 'Prensar maconha', from = 'folha_maconha', need = 3, to = 'maconha', give = 2, ms = 5000 },
}

-- venda para NPCs da favela (pagamento em dinheiro sujo)
Config.Sales = {
    cocaina = { min = 350, max = 600 }, maconha = { min = 110, max = 210 }, pasta_base = { min = 140, max = 260 },
}
Config.SaleSuccess = 0.7
Config.SaleAlertChance = 0.25   -- chance de denúncia quando o NPC recusa
Config.CopBonus = 0.08          -- +8% de pagamento por policial em serviço (máx 5)

-- mercado negro (paga com dinheiro sujo primeiro)
Config.BlackMarket = { coords = vec3(78.0, -1942.0, 21.0), heading = 140.0, ped = 'g_m_y_mexgoon_01', items = {
    { item = 'weapon_pistol', price = 12000 }, { item = 'weapon_microsmg', price = 28000 },
    { item = 'weapon_assaultrifle', price = 55000 }, { item = 'weapon_machete', price = 1500 },
    { item = 'municao', price = 300 }, { item = 'colete', price = 2500 }, { item = 'explosivo', price = 15000 },
} }

-- desmanche de veículos roubados
Config.Chop = { coords = vec3(125.0, -1930.0, 20.7), cooldown = 60, alertChance = 0.6,
    pay = { [0] = 1500, [1] = 2500, [2] = 2600, [3] = 2000, [4] = 4500, [5] = 4000, [6] = 4500, [7] = 6000, [8] = 1800,
            [9] = 2500, [12] = 2500, [13] = 500 }, defaultPay = 1200 }

-- lavagem de dinheiro
Config.Launder = { coords = vec3(25.0, -1391.6, 29.3), rate = 0.75, maxPerTrade = 20000 }

-- assalto ao carro-forte
Config.Heist = {
    starter = vec3(90.0, -1965.0, 20.8), minCops = 2, cooldown = 45 * 60,
    need = 'explosivo', fuse = 10, loot = { 40000, 70000 },
    routes = {
        { start = vec4(-1.0, -1500.0, 29.6, 140.0), dest = vec3(1170.0, -1650.0, 36.0) },
        { start = vec4(307.0, -1211.0, 29.3, 90.0), dest = vec3(-1100.0, -800.0, 19.0) },
        { start = vec4(-300.0, -800.0, 32.0, 70.0), dest = vec3(800.0, -2000.0, 29.3) },
    },
}
