exports('GetData', function() return PE.Data end)
exports('ItemLabel', function(n) return Config.Items[n] and Config.Items[n].label end)

RegisterNetEvent('pe:notify', function(msg) PE.Notify(msg) end)

-- personagem -------------------------------------------------------------------
local function applyModel(name)
    local hash = PE.LoadModel(name)
    if not hash then return end
    SetPlayerModel(PlayerId(), hash)
    SetModelAsNoLongerNeeded(hash)
    SetPedDefaultComponentVariation(PlayerPedId())
end

local function openModelMenu()
    local items = {}
    for _, m in ipairs(Config.Models) do items[#items + 1] = { label = m[2] } end
    PE.Menu('Escolha seu personagem', items, function(i)
        local m = Config.Models[i]
        if m then
            applyModel(m[1])
            TriggerServerEvent('pe:server:setMeta', 'model', m[1])
            PE.Notify('Personagem alterado.')
        end
    end)
end
RegisterCommand('personagem', openModelMenu, false)

-- spawn --------------------------------------------------------------------------
CreateThread(function()
    while not NetworkIsSessionStarted() do Wait(100) end
    exports.spawnmanager:setAutoSpawn(false)
    TriggerServerEvent('pe:server:ready')
    while not PE.Data do Wait(100) end

    local meta = PE.Data.meta or {}
    local pos = meta.pos or { x = Config.Spawn.x, y = Config.Spawn.y, z = Config.Spawn.z, w = Config.Spawn.w }
    exports.spawnmanager:spawnPlayer({
        x = pos.x, y = pos.y, z = pos.z, heading = pos.w or 0.0,
        model = joaat(meta.model or 'a_m_y_hipster_01'), skipFade = false,
    }, function()
        ShutdownLoadingScreen()
        ShutdownLoadingScreenNui()
        TriggerEvent('pe:spawned')
        if not meta.model then
            PE.Notify('Bem-vindo a ' .. Config.ServerName .. '! Escolha seu personagem.')
            openModelMenu()
        end
    end)
end)

CreateThread(function()
    while true do
        Wait(30000)
        if PE.Data and not IsEntityDead(PlayerPedId()) and not LocalPlayer.state.arena and not LocalPlayer.state.dead then
            local c, h = GetEntityCoords(PlayerPedId()), GetEntityHeading(PlayerPedId())
            TriggerServerEvent('pe:server:setMeta', 'pos', { x = c.x, y = c.y, z = c.z, w = h })
        end
    end
end)

-- mundo: sem polícia/ambulância NPC, sem nível de procurado ----------------------------
CreateThread(function()
    for i = 1, 15 do EnableDispatchService(i, false) end
    SetMaxWantedLevel(0)
    SetCreateRandomCops(false)
    SetCreateRandomCopsNotOnScenarios(false)
    SetCreateRandomCopsOnScenarios(false)
    for _, m in ipairs({ `police`, `police2`, `police3`, `policeb`, `polmav`, `riot`, `fbi`, `fbi2`, `sheriff`, `ambulance`, `firetruk` }) do
        SetVehicleModelIsSuppressed(m, true)
    end
    while true do
        SetPlayerWantedLevel(PlayerId(), 0, false)
        SetPlayerWantedLevelNow(PlayerId(), false)
        Wait(1000)
    end
end)

-- inventário ------------------------------------------------------------------------
local function itemMenu(name)
    local def = Config.Items[name]
    if not def then return end
    PE.Menu(def.label .. ' (x' .. PE.ItemCount(name) .. ')', {
        { label = 'Usar' }, { label = 'Dar ao jogador mais próximo' }, { label = 'Jogar fora' },
    }, function(i)
        if i == 1 then
            TriggerServerEvent('pe:server:useItem', name)
        elseif i == 2 then
            local tgt = PE.ClosestPlayer(3.0)
            if not tgt then return PE.Notify('Ninguém por perto.') end
            PE.Input('Quantidade', '1', function(v) TriggerServerEvent('pe:server:giveItem', tgt, name, tonumber(v) or 1) end)
        else
            PE.Input('Quantidade a jogar fora', '1', function(v) TriggerServerEvent('pe:server:dropItem', name, tonumber(v) or 1) end)
        end
    end)
end

local function openInventory()
    local d = PE.Data
    if not d then return end
    local names, items = {}, {}
    for name, count in pairs(d.inv) do
        local def = Config.Items[name]
        if def then names[#names + 1] = name end
    end
    table.sort(names, function(a, b) return Config.Items[a].label < Config.Items[b].label end)
    for _, name in ipairs(names) do
        items[#items + 1] = { label = Config.Items[name].label, right = 'x' .. d.inv[name],
            desc = Config.Items[name].illegal and 'Item ilegal' or nil }
    end
    if #items == 0 then return PE.Notify('Seu inventário está vazio.') end
    PE.Menu(('Inventário  |  $%d em mãos'):format(d.cash), items, function(i) itemMenu(names[i]) end)
end
RegisterCommand('inventario', openInventory, false)
RegisterKeyMapping('inventario', 'Abrir inventário', 'keyboard', 'F2')

RegisterCommand('jobmenu', function() TriggerEvent('pe:jobmenu') end, false)
RegisterKeyMapping('jobmenu', 'Menu do trabalho (polícia/médico/mecânico)', 'keyboard', 'F6')

-- efeitos de itens ---------------------------------------------------------------------
RegisterNetEvent('pe:client:consume', function(kind)
    local ped = PlayerPedId()
    local dict, anim = 'mp_player_inteat@burger', 'mp_player_int_eat_burger'
    if kind == 'drink' then dict, anim = 'mp_player_intdrink', 'loop_bottle' end
    if PE.LoadAnim(dict) then
        TaskPlayAnim(ped, dict, anim, 8.0, -8.0, 3000, 49, 0, false, false, false)
        Wait(3000)
        ClearPedTasks(ped)
    end
end)

RegisterNetEvent('pe:client:giveWeapon', function(weapon)
    local ped = PlayerPedId()
    local hash = joaat(weapon)
    if not HasPedGotWeapon(ped, hash, false) then GiveWeaponToPed(ped, hash, 60, false, true) end
    SetCurrentPedWeapon(ped, hash, true)
end)

RegisterNetEvent('pe:client:addAmmo', function(n)
    local ped = PlayerPedId()
    local _, w = GetCurrentPedWeapon(ped, true)
    if w and w ~= `WEAPON_UNARMED` then
        AddAmmoToPed(ped, w, n)
        TriggerServerEvent('pe:server:consume', 'municao')
        PE.Notify('Munição recarregada.')
    else
        PE.Notify('Empunhe uma arma primeiro.')
    end
end)

RegisterNetEvent('pe:client:heal', function()
    local ped = PlayerPedId()
    if PE.Progress('Usando kit médico...', 4000, { 'amb@world_human_clipboard@male@idle_a', 'idle_c' }) then
        SetEntityHealth(ped, math.min(GetEntityMaxHealth(ped), GetEntityHealth(ped) + 80))
        TriggerServerEvent('pe:server:consume', 'kit_medico')
    end
end)

RegisterNetEvent('pe:client:armor', function()
    if PE.Progress('Vestindo colete...', 3000) then
        SetPedArmour(PlayerPedId(), 100)
        TriggerServerEvent('pe:server:consume', 'colete')
    end
end)

RegisterNetEvent('pe:client:repairKit', function()
    local ped = PlayerPedId()
    local c = GetEntityCoords(ped)
    local veh = GetClosestVehicle(c.x, c.y, c.z, 4.0, 0, 71)
    if veh == 0 then return PE.Notify('Nenhum veículo por perto.') end
    if PE.Progress('Reparando veículo...', 8000, { 'mini@repair', 'fixing_a_ped' }) then
        SetVehicleFixed(veh)
        SetVehicleDeformationFixed(veh)
        SetVehicleEngineHealth(veh, 1000.0)
        SetVehicleDirtLevel(veh, 0.0)
        TriggerServerEvent('pe:server:consume', 'kit_reparo')
        PE.Notify('Veículo reparado.')
    end
end)

-- remove armas cujo item não está mais no inventário ------------------------------------------
RegisterNetEvent('pe:client:update', function(d)
    if LocalPlayer.state.arena then return end
    local ped = PlayerPedId()
    local keep = {}
    for name, def in pairs(Config.Items) do
        if def.weapon and (d.inv[name] or 0) > 0 then keep[joaat(def.weapon)] = true end
    end
    for name, def in pairs(Config.Items) do
        if def.weapon then
            local h = joaat(def.weapon)
            if not keep[h] and HasPedGotWeapon(ped, h, false) then RemoveWeaponFromPed(ped, h) end
        end
    end
end)

-- fome e sede ---------------------------------------------------------------------------------
CreateThread(function()
    while true do
        Wait(10000)
        local d = PE.Data
        if d and Config.NeedsEnabled and ((d.meta.hunger or 100) <= 0 or (d.meta.thirst or 100) <= 0) then
            local ped = PlayerPedId()
            if GetEntityHealth(ped) > 110 then
                SetEntityHealth(ped, GetEntityHealth(ped) - 4)
                PE.Notify('Você está com fome/sede e se sentindo fraco!')
            end
        end
    end
end)
