local isDown, downAt = false, 0
local function isMedic(duty) return PE.IsJob('ems', duty) end

-- hospitais -----------------------------------------------------------------------
local function openLocker()
    local j = PE.Job()
    PE.Menu('Armário do Hospital', {
        { label = j.duty and 'Sair de serviço' or 'Entrar em serviço' }, { label = 'Suprimentos' },
    }, function(i)
        if i == 1 then TriggerServerEvent('pe_ems:duty')
        elseif not j.duty then PE.Notify('Entre em serviço primeiro.')
        else
            local items = {}
            for _, e in ipairs(Config.Armory) do items[#items + 1] = { label = PE.ItemLabel(e.item), right = 'máx ' .. e.max } end
            PE.Menu('Suprimentos', items, function(k) TriggerServerEvent('pe_ems:supply', Config.Armory[k].item) end)
        end
    end)
end

for _, h in ipairs(Config.Hospitals) do
    if h.blip then PE.Blip(h.locker, 61, 2, h.name, 0.9) end
    PE.Zone({ coords = h.locker, label = 'Armário dos paramédicos', canUse = function() return isMedic(false) end,
        action = openLocker, color = { 231, 76, 60 } })
    PE.Zone({ coords = h.reception, label = ('Atendimento médico ($%d)'):format(Config.HealFee),
        color = { 231, 76, 60 }, action = function() TriggerServerEvent('pe_ems:heal') end })
    PE.Zone({ coords = h.garage, label = 'Garagem do hospital', radius = 2.5, vehicle = false,
        canUse = function() return isMedic(true) end, color = { 231, 76, 60 }, action = function()
            local items, list = {}, {}
            for _, v in ipairs(Config.Vehicles) do
                if PE.Job().grade >= v.grade then list[#list + 1] = v; items[#items + 1] = { label = v.label } end
            end
            PE.Menu('Garagem do Hospital', items, function(i) PE.SpawnVehicle(list[i].model, h.spawn, 'SAMU' .. math.random(10, 99)) end)
        end })
    PE.Zone({ coords = h.garage, label = 'Guardar veículo', radius = 4.0, vehicle = true,
        canUse = function() return isMedic(true) end, color = { 231, 76, 60 }, action = function()
            local veh = GetVehiclePedIsIn(PlayerPedId(), false)
            if veh ~= 0 then DeleteEntity(veh) end
        end })
end

-- menu do paramédico (F6) ---------------------------------------------------------------
local function closestDowned()
    local pc = GetEntityCoords(PlayerPedId())
    for _, pid in ipairs(GetActivePlayers()) do
        if pid ~= PlayerId() and #(GetEntityCoords(GetPlayerPed(pid)) - pc) < 3.0 then
            local sid = GetPlayerServerId(pid)
            if Player(sid).state.dead then return sid end
        end
    end
end

AddEventHandler('pe:jobmenu', function()
    if not isMedic(true) then return end
    PE.Menu('Paramédicos', {
        { label = 'Reanimar paciente caído' }, { label = 'Tratar paciente', desc = 'Cura completa' },
        { label = 'Cobrar atendimento', desc = 'Envia cobrança ao paciente próximo' },
    }, function(i)
        if i == 1 then
            local t = closestDowned()
            if not t then return PE.Notify('Nenhum paciente caído por perto.') end
            if PE.Progress('Reanimando...', 8000, { 'mini@cpr@char_a@cpr_str', 'cpr_pumpchest' }) then
                TriggerServerEvent('pe_ems:revive', t)
            end
        elseif i == 2 then
            local t = PE.ClosestPlayer(3.0)
            if not t then return PE.Notify('Ninguém por perto.') end
            if PE.Progress('Tratando ferimentos...', 6000, { 'amb@medic@standing@tendtodead@idle_a', 'idle_a' }) then
                TriggerServerEvent('pe_ems:treat', t)
            end
        else
            PE.Input('Valor da cobrança', '0', function(v)
                local t = PE.ClosestPlayer(4.0)
                if t then TriggerServerEvent('pe_bank:chargeRequest', t, tonumber(v), 'Atendimento médico') end
            end)
        end
    end)
end)

-- estado de "caído" -----------------------------------------------------------------------
local function standUp(health)
    local ped = PlayerPedId()
    isDown = false
    SetEntityInvincible(ped, false)
    SetEntityHealth(ped, health or 140)
    ClearPedTasksImmediately(ped)
    LocalPlayer.state:set('dead', false, true)
end

local function nearestHospital()
    local pc, best, bd = GetEntityCoords(PlayerPedId()), Config.Hospitals[1], 1e9
    for _, h in ipairs(Config.Hospitals) do
        local d = #(pc - vec3(h.bed.x, h.bed.y, h.bed.z))
        if d < bd then best, bd = h, d end
    end
    return best
end

local function goDown()
    isDown, downAt = true, GetGameTimer()
    local ped = PlayerPedId()
    local c, h = GetEntityCoords(ped), GetEntityHeading(ped)
    local veh = GetVehiclePedIsIn(ped, false)
    NetworkResurrectLocalPlayer(c.x, c.y, c.z, h, true, false)
    ped = PlayerPedId()
    SetEntityInvincible(ped, true)
    SetEntityHealth(ped, 200)
    if veh ~= 0 then TaskLeaveVehicle(ped, veh, 16); Wait(1500) end
    LocalPlayer.state:set('dead', true, true)
    PE.LoadAnim('dead')
    local alerted = false
    while isDown do
        Wait(0)
        ped = PlayerPedId()
        DisableAllControlActions(0)
        for _, k in ipairs({ 1, 2, 245, 249, 38, 47 }) do EnableControlAction(0, k, true) end
        if not IsEntityPlayingAnim(ped, 'dead', 'dead_a', 3) then
            TaskPlayAnim(ped, 'dead', 'dead_a', 8.0, -8.0, -1, 1, 0, false, false, false)
        end
        local elapsed = (GetGameTimer() - downAt) / 1000
        local left = math.max(0, math.floor(Config.BleedoutSeconds - elapsed))
        PE.Text(0.5, 0.82, ('Você está ferido. Sangrando: %ds'):format(left), 0.5, { 255, 90, 90, 255 }, { center = true })
        if not alerted then
            PE.Text(0.5, 0.87, '[E] Chamar paramédicos', 0.42, nil, { center = true })
            if IsControlJustReleased(0, 38) then alerted = true; TriggerServerEvent('pe_ems:alert') end
        else
            PE.Text(0.5, 0.87, 'Chamado enviado. Aguarde socorro.', 0.42, { 120, 230, 140, 255 }, { center = true })
        end
        if elapsed >= Config.RespawnAfter then
            PE.Text(0.5, 0.91, ('[G] Ir ao hospital (-$%d)'):format(Config.RespawnFee), 0.42, { 255, 215, 120, 255 }, { center = true })
            if IsControlJustReleased(0, 47) or elapsed >= Config.BleedoutSeconds then
                TriggerServerEvent('pe_ems:respawn')
                local hosp = nearestHospital()
                standUp(200)
                PE.Teleport(hosp.bed)
                PE.Notify('Você acordou no hospital. Esqueça o que aconteceu antes (regra de nova vida).')
                break
            end
        end
    end
end

CreateThread(function()
    while true do
        Wait(250)
        if not isDown and IsEntityDead(PlayerPedId()) and not LocalPlayer.state.arena then goDown() end
    end
end)

RegisterNetEvent('pe_ems:client:revive', function()
    if isDown then standUp(140); PE.Notify('Você foi reanimado.') end
end)
RegisterNetEvent('pe_ems:client:treat', function()
    local ped = PlayerPedId()
    SetEntityHealth(ped, GetEntityMaxHealth(ped))
    PE.Notify('Você foi tratado pelos paramédicos.')
end)
RegisterNetEvent('pe_ems:client:alert', function(a)
    if not isMedic(true) then return end
    PE.Notify('~r~[192]~s~ ' .. a.msg)
    PlaySoundFrontend(-1, 'Menu_Accept', 'Phone_SoundSet_Default', true)
    local b = AddBlipForCoord(a.x, a.y, a.z)
    SetBlipSprite(b, 153); SetBlipColour(b, 1); SetBlipScale(b, 1.2); SetBlipFlashes(b, true)
    SetTimeout(90000, function() RemoveBlip(b) end)
end)
RegisterNetEvent('pe_ems:client:healed', function()
    local ped = PlayerPedId()
    SetEntityHealth(ped, GetEntityMaxHealth(ped))
end)
