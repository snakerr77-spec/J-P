local function notCop() return not PE.IsJob('policia', true) end

-- colheita ----------------------------------------------------------------------------------
for i, f in ipairs(Config.Fields) do
    PE.Zone({ coords = f.coords, label = f.label, radius = 6.0, color = { 120, 200, 80 }, canUse = notCop, action = function()
        if IsPedInAnyVehicle(PlayerPedId(), false) then return end
        if PE.Progress('Colhendo...', 5000, { 'amb@world_human_gardener_plant@male@base', 'base' }) then
            TriggerServerEvent('pe_favela:harvest', i)
        end
    end })
end

-- laboratório -----------------------------------------------------------------------------------
PE.Zone({ coords = Config.Lab, label = 'Laboratório clandestino', radius = 2.0, color = { 170, 70, 200 }, canUse = notCop, action = function()
    local items = {}
    for _, r in ipairs(Config.Recipes) do
        items[#items + 1] = { label = r.label, desc = ('%dx %s -> %dx %s'):format(r.need, PE.ItemLabel(r.from), r.give, PE.ItemLabel(r.to)) }
    end
    PE.Menu('Laboratório', items, function(i)
        local r = Config.Recipes[i]
        if PE.Progress(r.label .. '...', r.ms, { 'anim@amb@business@coc@coc_unpack_cut_left@', 'coke_cut_v5_coccutter' }) then
            TriggerServerEvent('pe_favela:craft', r.id)
        end
    end)
end })

-- vendedor do mercado negro ---------------------------------------------------------------------------
CreateThread(function()
    local bm = Config.BlackMarket
    PE.Ped(bm.ped, bm.coords, bm.heading, 'WORLD_HUMAN_SMOKING')
end)
PE.Zone({ coords = Config.BlackMarket.coords, label = 'Falar com o Zé do Morro', radius = 1.8, color = { 231, 76, 60 },
    canUse = notCop, action = function()
        local items = {}
        for _, e in ipairs(Config.BlackMarket.items) do items[#items + 1] = { label = PE.ItemLabel(e.item), right = '$' .. e.price } end
        local function open()
            PE.Menu('Zé do Morro (aceita dinheiro sujo)', items, function(i)
                TriggerServerEvent('pe_favela:buy', i)
                SetTimeout(700, open)
            end)
        end
        open()
    end })

-- vender para NPCs -------------------------------------------------------------------------------------
local sold = {}
local function closestPed()
    local pc = GetEntityCoords(PlayerPedId())
    local handle, ped = FindFirstPed()
    local best, bd = nil, 2.6
    local ok = true
    while ok do
        if DoesEntityExist(ped) and not IsPedAPlayer(ped) and not IsPedDeadOrDying(ped, true) and not IsPedInAnyVehicle(ped, false)
            and not sold[ped] and IsPedHuman(ped) then
            local d = #(GetEntityCoords(ped) - pc)
            if d < bd then best, bd = ped, d end
        end
        ok, ped = FindNextPed(handle)
    end
    EndFindPed(handle)
    return best
end

CreateThread(function()
    local Z = Config.Zone
    while true do
        local sleep = 1000
        local ped = PlayerPedId()
        if notCop() and #(GetEntityCoords(ped) - Z.center) < Z.radius and not PE.busy and not IsPedInAnyVehicle(ped, false) then
            local has = false
            for item in pairs(Config.Sales) do if PE.ItemCount(item) > 0 then has = true end end
            if has then
                local npc = closestPed()
                if npc then
                    sleep = 0
                    PE.Help('~INPUT_CONTEXT~ Oferecer drogas')
                    if IsControlJustReleased(0, 38) then
                        local items, names = {}, {}
                        for item in pairs(Config.Sales) do
                            if PE.ItemCount(item) > 0 then
                                names[#names + 1] = item
                                items[#items + 1] = { label = PE.ItemLabel(item), right = 'x' .. PE.ItemCount(item) }
                            end
                        end
                        PE.Menu('Oferecer', items, function(i)
                            sold[npc] = true
                            TaskTurnPedToFaceEntity(npc, PlayerPedId(), 1500)
                            if PE.Progress('Negociando...', 2500, { 'mp_common', 'givetake1_a' }) then
                                TriggerServerEvent('pe_favela:sell', names[i])
                            end
                            ClearPedTasks(npc)
                            TaskWanderStandard(npc, 10.0, 10)
                        end)
                    end
                end
            end
        end
        Wait(sleep)
    end
end)

-- desmanche --------------------------------------------------------------------------------------------------
PE.Zone({ coords = Config.Chop.coords, label = 'Desmanchar veículo roubado', radius = 5.0, vehicle = true,
    color = { 231, 76, 60 }, canUse = notCop, action = function()
        local veh = GetVehiclePedIsIn(PlayerPedId(), false)
        local plate = (GetVehicleNumberPlateText(veh) or ''):gsub('%s+$', '')
        if exports.pe_garage:IsOwned(plate) then return PE.Notify('O dono desse carro é você! Não dá pra desmontar.') end
        TaskLeaveVehicle(PlayerPedId(), veh, 0)
        Wait(1500)
        if PE.Progress('Desmontando veículo...', 10000, { 'mini@repair', 'fixing_a_ped' }) then
            TriggerServerEvent('pe_favela:chop', GetVehicleClass(veh))
            DeleteEntity(veh)
        end
    end })

-- lavagem ----------------------------------------------------------------------------------------------------------
PE.Blip(Config.Launder.coords, 500, 2, 'Lava-rápido', 0.7)
PE.Zone({ coords = Config.Launder.coords, label = 'Lavar dinheiro (taxa de ' .. math.floor((1 - Config.Launder.rate) * 100) .. '%)',
    radius = 2.0, color = { 120, 200, 80 }, canUse = notCop, action = function()
        PE.Input(('Quanto lavar? (você tem $%d sujos)'):format(PE.ItemCount('dinheiro_sujo')), '0', function(v)
            if PE.Progress('Lavando...', 5000) then TriggerServerEvent('pe_favela:launder', tonumber(v)) end
        end)
    end })

-- carro-forte --------------------------------------------------------------------------------------------------------------
local truck, driver, guard, truckBlip
local planted = false

local function requestControl(ent)
    local t = 0
    while not NetworkHasControlOfEntity(ent) and t < 50 do NetworkRequestControlOfEntity(ent); Wait(50); t = t + 1 end
end

PE.Zone({ coords = Config.Heist.starter, label = 'Planejar assalto ao carro-forte', radius = 2.0, color = { 231, 76, 60 },
    canUse = function() return notCop() and not truck end, action = function()
        PE.Callback('pe_favela:heistStart', function(ok, info)
            if not ok then return PE.Notify(info) end
            local r = Config.Heist.routes[info]
            local vh = PE.LoadModel('stockade')
            local dh = PE.LoadModel('s_m_m_armoured_01')
            if not vh or not dh then return PE.Notify('Falha ao carregar o carro-forte.') end
            truck = CreateVehicle(vh, r.start.x, r.start.y, r.start.z, r.start.w, true, false)
            SetEntityAsMissionEntity(truck, true, true)
            SetVehicleDoorsLocked(truck, 2)
            driver = CreatePedInsideVehicle(truck, 4, dh, -1, true, false)
            guard = CreatePedInsideVehicle(truck, 4, dh, 0, true, false)
            for _, p in ipairs({ driver, guard }) do
                SetPedCombatAttributes(p, 46, true)
                SetPedFleeAttributes(p, 0, false)
                GiveWeaponToPed(p, `WEAPON_PISTOL`, 100, false, true)
            end
            TaskVehicleDriveToCoordLongrange(driver, truck, r.dest.x, r.dest.y, r.dest.z, 18.0, 786603, 12.0)
            truckBlip = AddBlipForEntity(truck)
            SetBlipSprite(truckBlip, 67); SetBlipColour(truckBlip, 1); SetBlipRoute(truckBlip, true)
            planted = false
            TriggerServerEvent('pe_favela:heistSpawned', NetworkGetNetworkIdFromEntity(truck))
            PE.Notify('O carro-forte saiu do depósito. Intercepte-o, neutralize os guardas e plante o explosivo na traseira.')
        end)
    end })

CreateThread(function()
    while true do
        if truck and DoesEntityExist(truck) then
            Wait(0)
            local pc = GetEntityCoords(PlayerPedId())
            local rear = GetOffsetFromEntityInWorldCoords(truck, 0.0, -4.2, 0.0)
            if #(pc - rear) < 2.5 and GetEntitySpeed(truck) < 3.0 and not IsPedInAnyVehicle(PlayerPedId(), false) then
                if not planted and PE.ItemCount(Config.Heist.need) > 0 then
                    PE.Help('~INPUT_CONTEXT~ Plantar explosivo na porta traseira')
                    if IsControlJustReleased(0, 38) then
                        if PE.Progress('Plantando explosivo...', 5000, { 'anim@heists@ornate_bank@thermal_charge', 'thermal_charge' }) then
                            TriggerServerEvent('pe_favela:heistPlant')
                        end
                    end
                elseif planted == 'open' then
                    PE.Help('~INPUT_CONTEXT~ Saquear o dinheiro')
                    if IsControlJustReleased(0, 38) then
                        if PE.Progress('Pegando o dinheiro...', 12000, { 'anim@heists@ornate_bank@grab_cash', 'grab' }) then
                            TriggerServerEvent('pe_favela:heistLoot')
                            planted = false
                            if truckBlip then RemoveBlip(truckBlip); truckBlip = nil end
                            SetEntityAsNoLongerNeeded(truck); truck = nil
                        end
                    end
                end
            end
        else
            if truck then truck = nil end
            Wait(1000)
        end
    end
end)

RegisterNetEvent('pe_favela:client:plantOk', function(netId)
    planted = true
    PE.Notify(('Explosivo armado! Afaste-se: detonação em %d segundos.'):format(Config.Heist.fuse))
    SetTimeout(Config.Heist.fuse * 1000, function()
        local ent = NetToVeh(netId)
        if ent ~= 0 and DoesEntityExist(ent) then
            requestControl(ent)
            local p = GetOffsetFromEntityInWorldCoords(ent, 0.0, -3.6, 0.5)
            AddExplosion(p.x, p.y, p.z, 2, 0.6, true, false, 1.0)
            SetVehicleDoorBroken(ent, 2, true)
            SetVehicleDoorBroken(ent, 3, true)
            planted = 'open'
        end
    end)
end)

-- a polícia acompanha o carro-forte
local pingBlip
RegisterNetEvent('pe_favela:client:ping', function(x, y, z)
    if not PE.IsJob('policia', true) then return end
    if not pingBlip then
        pingBlip = AddBlipForCoord(x, y, z)
        SetBlipSprite(pingBlip, 67); SetBlipColour(pingBlip, 1); SetBlipScale(pingBlip, 1.1); SetBlipFlashes(pingBlip, true)
        BeginTextCommandSetBlipName('STRING'); AddTextComponentSubstringPlayerName('Carro-forte'); EndTextCommandSetBlipName(pingBlip)
        SetTimeout(1200000, function() if pingBlip then RemoveBlip(pingBlip); pingBlip = nil end end)
    end
    SetBlipCoords(pingBlip, x, y, z)
end)
