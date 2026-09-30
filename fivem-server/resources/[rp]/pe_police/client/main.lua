local cuffed, jailed = false, false

local function isCop(duty) return PE.IsJob('policia', duty) end

-- estações ---------------------------------------------------------------------------
local function openLocker()
    local j = PE.Job()
    PE.Menu('Armário da Polícia', {
        { label = j.duty and 'Sair de serviço' or 'Entrar em serviço' },
        { label = 'Equipamentos', desc = 'Requer estar em serviço' },
    }, function(i)
        if i == 1 then
            TriggerServerEvent('pe_police:duty')
        else
            if not j.duty then return PE.Notify('Entre em serviço primeiro.') end
            local items, list = {}, {}
            for _, e in ipairs(Config.Armory) do
                if j.grade >= e.grade then
                    list[#list + 1] = e
                    items[#items + 1] = { label = PE.ItemLabel(e.item), right = 'máx ' .. e.max }
                end
            end
            PE.Menu('Equipamentos', items, function(k) TriggerServerEvent('pe_police:armory', list[k].item) end)
        end
    end)
end

local function openGarage(st)
    local j = PE.Job()
    local items, list = {}, {}
    for _, v in ipairs(Config.Vehicles) do
        if j.grade >= v.grade then
            list[#list + 1] = v
            items[#items + 1] = { label = v.label, desc = v.model }
        end
    end
    PE.Menu('Garagem da Polícia', items, function(i)
        local v = list[i]
        local veh = PE.SpawnVehicle(v.model, st.spawn, 'PM' .. math.random(1000, 9999))
        if veh then PE.Notify('Viatura liberada.') end
    end)
end

for _, st in ipairs(Config.Stations) do
    if st.blip then PE.Blip(st.locker, 60, 3, st.name, 0.9) end
    PE.Zone({ coords = st.locker, label = 'Armário da polícia', canUse = function() return isCop(false) end,
        action = openLocker, color = { 52, 152, 219 } })
    PE.Zone({ coords = st.garage, label = 'Garagem da polícia', radius = 2.5, vehicle = false,
        canUse = function() return isCop(true) end, action = function() openGarage(st) end, color = { 52, 152, 219 } })
    PE.Zone({ coords = st.garage, label = 'Guardar viatura', radius = 4.0, vehicle = true,
        canUse = function() return isCop(true) end, color = { 231, 76, 60 }, action = function()
            local veh = GetVehiclePedIsIn(PlayerPedId(), false)
            if veh ~= 0 then DeleteEntity(veh) end
        end })
    if st.heli then
        PE.Zone({ coords = st.heli, label = 'Retirar helicóptero', radius = 3.0, vehicle = false,
            canUse = function() return isCop(true) and PE.Job().grade >= 3 end, color = { 52, 152, 219 },
            action = function() PE.SpawnVehicle('polmav', st.heli, 'PMAV' .. math.random(10, 99)) end })
    end
end

-- menu do policial (F6) ----------------------------------------------------------------
local props = {}
local function placeProp(model)
    local ped = PlayerPedId()
    local pos = GetOffsetFromEntityInWorldCoords(ped, 0.0, 1.5, 0.0)
    local hash = PE.LoadModel(model)
    if not hash then return end
    local obj = CreateObject(hash, pos.x, pos.y, pos.z, true, false, false)
    PlaceObjectOnGroundProperly(obj)
    SetEntityHeading(obj, GetEntityHeading(ped))
    FreezeEntityPosition(obj, true)
    props[#props + 1] = obj
end

local function withTarget(fn)
    local t = PE.ClosestPlayer(3.0)
    if not t then return PE.Notify('Ninguém por perto.') end
    fn(t)
end

local function openPoliceMenu()
    if not isCop(true) then return end
    local items = {
        { label = 'Algemar / desalgemar' }, { label = 'Escoltar / soltar' }, { label = 'Colocar no veículo' },
        { label = 'Retirar do veículo' }, { label = 'Revistar' }, { label = 'Multar' }, { label = 'Prender' },
        { label = 'Consultar identidade' }, { label = 'Conceder / revogar porte de arma', desc = 'Sargento ou superior' },
        { label = 'Colocar cone' }, { label = 'Colocar barreira' }, { label = 'Recolher objeto próximo' },
    }
    PE.Menu('Polícia Militar', items, function(i)
        if i == 1 then withTarget(function(t) TriggerServerEvent('pe_police:action', 'cuff', t) end)
        elseif i == 2 then withTarget(function(t) TriggerServerEvent('pe_police:action', 'escort', t) end)
        elseif i == 3 then withTarget(function(t) TriggerServerEvent('pe_police:action', 'putveh', t) end)
        elseif i == 4 then withTarget(function(t) TriggerServerEvent('pe_police:action', 'outveh', t) end)
        elseif i == 5 then withTarget(function(t) TriggerServerEvent('pe_police:action', 'search', t) end)
        elseif i == 6 then
            withTarget(function(t)
                PE.Input('Valor da multa', '0', function(v)
                    PE.Input('Motivo', 'Infração', function(r)
                        TriggerServerEvent('pe_police:action', 'fine', t, { amount = tonumber(v), reason = r })
                    end)
                end)
            end)
        elseif i == 7 then
            withTarget(function(t)
                PE.Input('Tempo de prisão (minutos)', '10', function(v)
                    TriggerServerEvent('pe_police:action', 'jail', t, { minutes = tonumber(v) })
                end)
            end)
        elseif i == 8 then withTarget(function(t) TriggerServerEvent('pe_police:action', 'id', t) end)
        elseif i == 9 then withTarget(function(t) TriggerServerEvent('pe_police:action', 'license', t) end)
        elseif i == 10 then placeProp(Config.Props.cone)
        elseif i == 11 then placeProp(Config.Props.barreira)
        else
            local pc = GetEntityCoords(PlayerPedId())
            for k = #props, 1, -1 do
                if not DoesEntityExist(props[k]) then table.remove(props, k)
                elseif #(GetEntityCoords(props[k]) - pc) < 4.0 then DeleteEntity(props[k]); table.remove(props, k); break end
            end
        end
    end)
end
AddEventHandler('pe:jobmenu', openPoliceMenu)

-- revista ------------------------------------------------------------------------------------
RegisterNetEvent('pe_police:client:search', function(target, list)
    local items = {}
    for _, e in ipairs(list) do
        items[#items + 1] = { label = e.label, right = 'x' .. e.count, desc = e.seizable and 'Enter: apreender' or nil }
    end
    if #items == 0 then return PE.Notify('O suspeito não carrega nada.') end
    PE.Menu('Revista', items, function(i)
        local e = list[i]
        if e and e.seizable then TriggerServerEvent('pe_police:confiscate', target, e.name) end
    end)
end)

RegisterNetEvent('pe_police:client:info', function(text) PE.Notify(text) end)

-- algemas / escolta (state bags) -----------------------------------------------------------------
local function myBag(bag) return bag == ('player:%d'):format(GetPlayerServerId(PlayerId())) end

AddStateBagChangeHandler('cuffed', nil, function(bag, _, value)
    if not myBag(bag) then return end
    cuffed = value == true
    local ped = PlayerPedId()
    if cuffed then
        SetCurrentPedWeapon(ped, `WEAPON_UNARMED`, true)
        PE.LoadAnim('mp_arresting')
        TaskPlayAnim(ped, 'mp_arresting', 'idle', 8.0, -8.0, -1, 49, 0, false, false, false)
    else
        ClearPedSecondaryTask(ped)
    end
end)

AddStateBagChangeHandler('escort', nil, function(bag, _, value)
    if not myBag(bag) then return end
    local ped = PlayerPedId()
    if value then
        local cop = GetPlayerFromServerId(tonumber(value))
        if cop ~= -1 then
            AttachEntityToEntity(ped, GetPlayerPed(cop), 11816, 0.54, 0.54, 0.0, 0.0, 0.0, 0.0, false, false, false, false, 2, true)
        end
    else
        DetachEntity(ped, true, false)
    end
end)

CreateThread(function()
    while true do
        if cuffed or jailed then
            Wait(0)
            local ped = PlayerPedId()
            DisablePlayerFiring(PlayerId(), true)
            if cuffed then
                for _, c in ipairs({ 21, 22, 23, 24, 25, 37, 44, 45, 140, 141, 142, 75 }) do DisableControlAction(0, c, true) end
                if not IsEntityPlayingAnim(ped, 'mp_arresting', 'idle', 3) and not IsPedInAnyVehicle(ped, false) then
                    TaskPlayAnim(ped, 'mp_arresting', 'idle', 8.0, -8.0, -1, 49, 0, false, false, false)
                end
            end
        else
            Wait(500)
        end
    end
end)

RegisterNetEvent('pe_police:client:putveh', function()
    local ped = PlayerPedId()
    local c = GetEntityCoords(ped)
    local veh = GetClosestVehicle(c.x, c.y, c.z, 6.0, 0, 71)
    if veh == 0 then return end
    DetachEntity(ped, true, false)
    for s = GetVehicleModelNumberOfSeats(GetEntityModel(veh)) - 2, 0, -1 do
        if IsVehicleSeatFree(veh, s) then TaskWarpPedIntoVehicle(ped, veh, s) return end
    end
end)

RegisterNetEvent('pe_police:client:outveh', function()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if veh ~= 0 then TaskLeaveVehicle(ped, veh, 16) end
end)

-- prisão -----------------------------------------------------------------------------------------------
local jailMinutes = 0
RegisterNetEvent('pe_police:client:jail', function(minutes)
    jailed, jailMinutes = true, minutes
    RemoveAllPedWeapons(PlayerPedId(), true)
    local c = Config.Jail.cells[math.random(#Config.Jail.cells)]
    PE.Teleport(c)
    PE.Notify(('Você foi preso por %d minuto(s).'):format(minutes))
end)
RegisterNetEvent('pe_police:client:jailTick', function(minutes) jailMinutes = minutes end)
RegisterNetEvent('pe_police:client:release', function()
    jailed = false
    PE.Teleport(Config.Jail.release)
    PE.Notify('Você cumpriu sua pena. Está livre!')
end)

CreateThread(function()
    while true do
        if jailed then
            Wait(0)
            PE.Text(0.5, 0.05, ('PRESO - restam %d min'):format(jailMinutes), 0.5, { 255, 120, 120, 255 }, { center = true })
            if #(GetEntityCoords(PlayerPedId()) - Config.Jail.center) > Config.Jail.radius then
                PE.Teleport(Config.Jail.cells[1])
            end
        else
            Wait(1000)
        end
    end
end)

AddEventHandler('pe:spawned', function() TriggerServerEvent('pe_police:checkJail') end)

-- alertas ------------------------------------------------------------------------------------------
RegisterNetEvent('pe_police:client:alert', function(a)
    if not isCop(true) then return end
    PE.Notify(('~r~[%s]~s~ %s'):format(a.code or 'CHAMADO', a.msg))
    PlaySoundFrontend(-1, 'Menu_Accept', 'Phone_SoundSet_Default', true)
    local b = AddBlipForCoord(a.x, a.y, a.z)
    SetBlipSprite(b, 161); SetBlipColour(b, 1); SetBlipScale(b, 1.3); SetBlipFlashes(b, true)
    SetTimeout(60000, function() RemoveBlip(b) end)
end)

-- tiros na cidade chamam a polícia
CreateThread(function()
    local last = 0
    while true do
        local ped = PlayerPedId()
        if IsPedArmed(ped, 4) then
            Wait(0)
            if IsPedShooting(ped) and GetGameTimer() - last > Config.ShotCooldown * 1000
                and not isCop(true) and not LocalPlayer.state.arena then
                local c = GetEntityCoords(ped)
                local ignore = false
                for _, z in ipairs(Config.NoShotAlert) do
                    if #(c - z.center) < z.radius then ignore = true end
                end
                if not ignore then
                    last = GetGameTimer()
                    TriggerServerEvent('pe_police:shots', c.x, c.y, c.z)
                end
            end
        else
            Wait(500)
        end
    end
end)
