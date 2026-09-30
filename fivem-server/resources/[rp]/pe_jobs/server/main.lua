local runs = {}   -- entregas em andamento por jogador

RegisterNetEvent('pe_jobs:setJob', function(name)
    local src = source
    if not PE.Near(src, Config.JobCenter, 10.0) then return end
    local ok = false
    for _, j in ipairs(Config.CivilJobs) do if j == name then ok = true end end
    local cur = PE.Job(src)
    if not ok or not cur then return end
    if cur.name == 'policia' or cur.name == 'ems' then
        return PE.Notify(src, 'Peça demissão ao seu chefe antes de mudar de emprego.')
    end
    exports.pe_core:SetJob(src, name, 0)
    PE.Notify(src, 'Emprego atualizado.')
end)

-- mecânico: entrar/sair de serviço na oficina ----------------------------------------------
RegisterNetEvent('pe_jobs:mechanicDuty', function()
    local src = source
    if not PE.IsJob(src, 'mecanico') or not PE.Near(src, Config.Mechanic.shop, 10.0) then return end
    local on = not PE.Job(src).duty
    exports.pe_core:SetDuty(src, on)
    if on and PE.ItemCount(src, 'kit_reparo') < 3 then PE.AddItem(src, 'kit_reparo', 3 - PE.ItemCount(src, 'kit_reparo')) end
    PE.Notify(src, on and 'Você entrou em serviço (kits de reparo entregues).' or 'Você saiu de serviço.')
end)

-- entregas ---------------------------------------------------------------------------------
RegisterNetEvent('pe_jobs:deliveryStart', function()
    local src = source
    if not PE.IsJob(src, 'entregador') or not PE.Near(src, Config.Delivery.depot, 15.0) then return end
    local pool = {}
    for i = 1, #Config.Delivery.drops do pool[i] = i end
    local route = {}
    for _ = 1, math.min(Config.Delivery.perRun, #pool) do
        route[#route + 1] = table.remove(pool, math.random(#pool))
    end
    runs[src] = { route = route, done = 0 }
    TriggerClientEvent('pe_jobs:client:deliveryRoute', src, route)
end)

RegisterNetEvent('pe_jobs:delivered', function(idx)
    local src = source
    local r = runs[src]
    local drop = Config.Delivery.drops[tonumber(idx) or 0]
    if not r or not drop or r.route[r.done + 1] ~= idx or not PE.Near(src, drop, 20.0) then return end
    local from = r.done == 0 and Config.Delivery.depot or Config.Delivery.drops[r.route[r.done]]
    local meters = #(vec3(from.x, from.y, from.z) - vec3(drop.x, drop.y, drop.z))
    local pay = math.floor(Config.Delivery.basePay + meters * Config.Delivery.perMeter)
    r.done = r.done + 1
    PE.AddMoney(src, 'cash', pay)
    PE.Notify(src, ('Entrega concluída: +$%d (%d/%d)'):format(pay, r.done, #r.route))
    if r.done >= #r.route then
        runs[src] = nil
        PE.AddMoney(src, 'bank', Config.Delivery.finishBonus)
        PE.Notify(src, ('Rota finalizada! Bônus de $%d no banco.'):format(Config.Delivery.finishBonus))
        TriggerClientEvent('pe_jobs:client:deliveryEnd', src)
    end
end)

RegisterNetEvent('pe_jobs:deliveryCancel', function() runs[source] = nil end)

-- taxista ------------------------------------------------------------------------------------
RegisterNetEvent('pe_jobs:taxiFare', function(a, b)
    local src = source
    local pa, pb = Config.Taxi.points[tonumber(a) or 0], Config.Taxi.points[tonumber(b) or 0]
    if not PE.IsJob(src, 'taxista') or not pa or not pb or a == b or not PE.Near(src, pb, 30.0) then return end
    local pay = math.floor(Config.Taxi.basePay + #(vec3(pa.x, pa.y, pa.z) - vec3(pb.x, pb.y, pb.z)) * Config.Taxi.perMeter)
    PE.AddMoney(src, 'cash', pay)
    PE.Notify(src, ('Corrida concluída: +$%d'):format(pay))
end)

AddEventHandler('playerDropped', function() runs[source] = nil end)
