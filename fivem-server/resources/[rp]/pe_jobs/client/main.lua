-- centro de empregos ---------------------------------------------------------------------
local JOBS = { entregador = 'Entregador', taxista = 'Taxista', mecanico = 'Mecânico', desempregado = 'Desempregado' }

PE.Blip(Config.JobCenter, 351, 5, 'Centro de Empregos', 0.85)
PE.Zone({ coords = Config.JobCenter, label = 'Centro de Empregos', radius = 2.0, color = { 241, 196, 15 }, action = function()
    local items = {}
    for _, k in ipairs(Config.CivilJobs) do items[#items + 1] = { label = JOBS[k] } end
    PE.Menu('Centro de Empregos', items, function(i) TriggerServerEvent('pe_jobs:setJob', Config.CivilJobs[i]) end)
end })

-- entregador -------------------------------------------------------------------------------------
local route, routeIdx, routeBlip, van = nil, 1, nil, nil
local function clearRoute()
    if routeBlip then RemoveBlip(routeBlip); routeBlip = nil end
    route = nil
end

local function nextBlip()
    if routeBlip then RemoveBlip(routeBlip) end
    local d = Config.Delivery.drops[route[routeIdx]]
    routeBlip = AddBlipForCoord(d.x, d.y, d.z)
    SetBlipSprite(routeBlip, 478); SetBlipColour(routeBlip, 5); SetBlipRoute(routeBlip, true)
    BeginTextCommandSetBlipName('STRING'); AddTextComponentSubstringPlayerName('Entrega'); EndTextCommandSetBlipName(routeBlip)
end

PE.Blip(Config.Delivery.depot, 478, 5, 'Centro de Entregas', 0.8)
PE.Zone({ coords = Config.Delivery.depot, label = 'Iniciar rota de entregas', color = { 241, 196, 15 },
    canUse = function() return PE.IsJob('entregador') and not route end, action = function()
        van = PE.SpawnVehicle(Config.Delivery.vehicle, Config.Delivery.spawn, 'ENTREGA')
        if van then TriggerServerEvent('pe_jobs:deliveryStart') end
    end })

RegisterNetEvent('pe_jobs:client:deliveryRoute', function(r)
    route, routeIdx = r, 1
    PE.Notify(('Rota iniciada: %d entregas. Siga o GPS.'):format(#r))
    nextBlip()
end)
RegisterNetEvent('pe_jobs:client:deliveryEnd', function()
    clearRoute()
    PE.Notify('Devolva a van ao centro de entregas.')
end)

CreateThread(function()
    while true do
        if route then
            Wait(0)
            local d = Config.Delivery.drops[route[routeIdx]]
            local pc = GetEntityCoords(PlayerPedId())
            if #(pc - d) < 25.0 then
                DrawMarker(1, d.x, d.y, d.z - 1.0, 0, 0, 0, 0, 0, 0, 3.0, 3.0, 1.0, 241, 196, 15, 120, false, false, 2, false, nil, nil, false)
                if #(pc - d) < 3.5 and not IsPedInAnyVehicle(PlayerPedId(), false) then
                    PE.Help('~INPUT_CONTEXT~ Entregar encomenda')
                    if IsControlJustReleased(0, 38) then
                        if PE.Progress('Entregando...', 3000, { 'mp_common', 'givetake1_a' }) then
                            TriggerServerEvent('pe_jobs:delivered', route[routeIdx])
                            routeIdx = routeIdx + 1
                            if route and route[routeIdx] then nextBlip() end
                        end
                    end
                elseif #(pc - d) < 3.5 then
                    PE.Help('Desça da van para entregar.')
                end
            end
        else
            Wait(1000)
        end
    end
end)

PE.Zone({ coords = Config.Delivery.depot, label = 'Devolver van / cancelar rota', radius = 6.0, vehicle = true,
    canUse = function() return PE.IsJob('entregador') end, color = { 231, 76, 60 }, action = function()
        local veh = GetVehiclePedIsIn(PlayerPedId(), false)
        if veh ~= 0 then DeleteEntity(veh) end
        if route then TriggerServerEvent('pe_jobs:deliveryCancel'); clearRoute() end
    end })

-- taxista ---------------------------------------------------------------------------------------------
local fare = nil     -- { ped, from, to, blip, stage }
local taxiOn = false

local function endFare(cancel)
    if fare then
        if fare.blip then RemoveBlip(fare.blip) end
        if fare.ped and DoesEntityExist(fare.ped) then
            if cancel then DeleteEntity(fare.ped) else SetPedAsNoLongerNeeded(fare.ped) end
        end
    end
    fare = nil
end

local function newFare()
    local pts = Config.Taxi.points
    local a = math.random(#pts)
    local b = math.random(#pts)
    while b == a do b = math.random(#pts) end
    local p = pts[a]
    local model = Config.Taxi.peds[math.random(#Config.Taxi.peds)]
    local hash = PE.LoadModel(model)
    if not hash then return end
    local ped = CreatePed(4, hash, p.x, p.y, p.z - 1.0, 0.0, false, false)
    SetBlockingOfNonTemporaryEvents(ped, true)
    SetModelAsNoLongerNeeded(hash)
    local blip = AddBlipForEntity(ped)
    SetBlipColour(blip, 5); SetBlipRoute(blip, true)
    fare = { ped = ped, from = a, to = b, blip = blip, stage = 'pickup' }
    PE.Notify('Novo passageiro! Siga o GPS até ele.')
end

PE.Blip(Config.Taxi.depot, 198, 5, 'Central de Táxi', 0.8)
PE.Zone({ coords = Config.Taxi.depot, label = 'Central de Táxi', radius = 2.0, color = { 241, 196, 15 },
    canUse = function() return PE.IsJob('taxista') end, action = function()
        PE.Menu('Central de Táxi', { { label = taxiOn and 'Encerrar expediente' or 'Iniciar expediente' }, { label = 'Retirar táxi' } }, function(i)
            if i == 1 then
                taxiOn = not taxiOn
                if not taxiOn then endFare(true) end
                PE.Notify(taxiOn and 'Expediente iniciado. Pegue o táxi.' or 'Expediente encerrado.')
            else
                PE.SpawnVehicle(Config.Taxi.vehicle, Config.Taxi.spawn, 'TAXI' .. math.random(10, 99))
            end
        end)
    end })

CreateThread(function()
    while true do
        if taxiOn and PE.IsJob('taxista') then
            Wait(500)
            local ped = PlayerPedId()
            local veh = GetVehiclePedIsIn(ped, false)
            if not fare then
                if veh ~= 0 then Wait(4000); if taxiOn and not fare then newFare() end end
            elseif fare.stage == 'pickup' then
                local p = Config.Taxi.points[fare.from]
                if veh ~= 0 and #(GetEntityCoords(ped) - p) < 12.0 and GetEntitySpeed(veh) < 2.0 then
                    ClearPedTasks(fare.ped)
                    TaskEnterVehicle(fare.ped, veh, 10000, 2, 1.0, 1, 0)
                    local t = 0
                    while not IsPedInVehicle(fare.ped, veh, false) and t < 40 do Wait(250); t = t + 1 end
                    if IsPedInVehicle(fare.ped, veh, false) then
                        RemoveBlip(fare.blip)
                        local d = Config.Taxi.points[fare.to]
                        fare.blip = AddBlipForCoord(d.x, d.y, d.z)
                        SetBlipSprite(fare.blip, 280); SetBlipColour(fare.blip, 5); SetBlipRoute(fare.blip, true)
                        fare.stage = 'dropoff'
                        PE.Notify('Passageiro a bordo. Leve-o ao destino.')
                    else
                        endFare(true)
                    end
                end
            elseif fare.stage == 'dropoff' then
                local d = Config.Taxi.points[fare.to]
                if veh ~= 0 and #(GetEntityCoords(ped) - d) < 12.0 and GetEntitySpeed(veh) < 2.0 then
                    TaskLeaveVehicle(fare.ped, veh, 0)
                    TriggerServerEvent('pe_jobs:taxiFare', fare.from, fare.to)
                    Wait(2500)
                    endFare(false)
                end
            end
        else
            if fare then endFare(true) end
            Wait(1500)
        end
    end
end)

-- mecânico ------------------------------------------------------------------------------------------------
PE.Blip(Config.Mechanic.shop, 446, 5, 'Oficina Mecânica', 0.8)
PE.Zone({ coords = Config.Mechanic.shop, label = 'Bater o ponto (mecânico)', radius = 2.0, color = { 230, 126, 34 },
    canUse = function() return PE.IsJob('mecanico') end, action = function() TriggerServerEvent('pe_jobs:mechanicDuty') end })

AddEventHandler('pe:jobmenu', function()
    if not PE.IsJob('mecanico', true) then return end
    PE.Menu('Mecânico', {
        { label = 'Reparar veículo próximo', desc = 'Sem custo de kit' }, { label = 'Lavar veículo próximo' },
        { label = 'Cobrar cliente', desc = 'Envia cobrança ao cliente mais próximo' },
    }, function(i)
        local c = GetEntityCoords(PlayerPedId())
        local veh = GetClosestVehicle(c.x, c.y, c.z, 4.0, 0, 71)
        if i == 3 then
            PE.Input('Valor da cobrança', '0', function(v)
                local t = PE.ClosestPlayer(4.0)
                if t then TriggerServerEvent('pe_bank:chargeRequest', t, tonumber(v), 'Serviço mecânico') end
            end)
        elseif veh == 0 then
            PE.Notify('Nenhum veículo por perto.')
        elseif i == 1 then
            if PE.Progress('Reparando...', 6000, { 'mini@repair', 'fixing_a_ped' }) then
                SetVehicleFixed(veh); SetVehicleDeformationFixed(veh); SetVehicleEngineHealth(veh, 1000.0)
                PE.Notify('Reparo concluído.')
            end
        else
            if PE.Progress('Lavando...', 4000, { 'timetable@floyd@clean_kitchen@base', 'base' }) then
                SetVehicleDirtLevel(veh, 0.0)
            end
        end
    end)
end)
