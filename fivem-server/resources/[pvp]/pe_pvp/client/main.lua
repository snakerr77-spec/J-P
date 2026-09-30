local inArena, loadout, returnPos = false, nil, nil

local function giveLoadout()
    local ped = PlayerPedId()
    RemoveAllPedWeapons(ped, true)
    for _, w in ipairs(Config.Loadouts[loadout].weapons) do
        GiveWeaponToPed(ped, joaat(w), 250, false, false)
    end
    SetCurrentPedWeapon(ped, joaat(Config.Loadouts[loadout].weapons[1]), true)
    SetEntityHealth(ped, GetEntityMaxHealth(ped))
    SetPedArmour(ped, 100)
end

local function spawnPoint()
    return Config.Spawns[math.random(#Config.Spawns)]
end

local function enter(idx)
    TriggerServerEvent('pe_pvp:join')
    local t = 0
    while not LocalPlayer.state.arena and t < 20 do Wait(100); t = t + 1 end
    if not LocalPlayer.state.arena then return PE.Notify('Você não pode entrar na arena agora.') end
    local ped = PlayerPedId()
    local c = GetEntityCoords(ped)
    returnPos = vec4(c.x, c.y, c.z, GetEntityHeading(ped))
    loadout, inArena = idx, true
    PE.Teleport(spawnPoint())
    giveLoadout()
    PE.Notify('Você entrou na ARENA. Digite /sairarena para sair e /ranking para ver o top 10.')
end

local function leave()
    if not inArena then return end
    inArena = false
    TriggerServerEvent('pe_pvp:leave')
    RemoveAllPedWeapons(PlayerPedId(), true)
    PE.Teleport(returnPos or vec4(Config.Entry.x, Config.Entry.y, Config.Entry.z, 0.0))
    PE.Notify('Você saiu da arena. Use seus itens para equipar armas novamente.')
end

PE.Blip(Config.Entry, 311, 1, 'Arena PVP', 0.9)
PE.Zone({ coords = Config.Entry, label = 'Entrar na Arena PVP', radius = 2.0, color = { 231, 76, 60 }, vehicle = false, action = function()
    local items = {}
    for _, l in ipairs(Config.Loadouts) do items[#items + 1] = { label = l.label } end
    PE.Menu('Arena PVP - escolha seu kit', items, enter)
end })

RegisterCommand('sairarena', leave, false)

RegisterCommand('ranking', function()
    PE.Callback('pe_pvp:ranking', function(top)
        local items = {}
        for i, s in ipairs(top) do
            items[i] = { label = ('%d. %s'):format(i, s.name), right = ('%d K / %d D'):format(s.kills, s.deaths),
                desc = 'Melhor sequência: ' .. s.best }
        end
        if #items == 0 then return PE.Notify('O ranking ainda está vazio.') end
        PE.Menu('Ranking da Arena', items, function() end)
    end)
end, false)

-- morte e renascimento dentro da arena ---------------------------------------------------------------
CreateThread(function()
    while true do
        Wait(200)
        if inArena then
            local ped = PlayerPedId()
            if IsEntityDead(ped) then
                local src = GetPedSourceOfDeath(ped)
                local killer = 0
                if src ~= 0 and IsPedAPlayer(src) then
                    local idx = NetworkGetPlayerIndexFromPed(src)
                    if idx ~= -1 then killer = GetPlayerServerId(idx) end
                end
                TriggerServerEvent('pe_pvp:died', killer)
                Wait(Config.RespawnDelay)
                local sp = spawnPoint()
                NetworkResurrectLocalPlayer(sp.x, sp.y, sp.z, sp.w, true, false)
                ClearPedTasksImmediately(PlayerPedId())
                giveLoadout()
            elseif #(GetEntityCoords(ped) - Config.Center) > Config.Radius then
                PE.Notify('Você saiu dos limites da arena!')
                local sp = spawnPoint()
                SetEntityCoords(ped, sp.x, sp.y, sp.z, false, false, false, false)
            end
        end
    end
end)

CreateThread(function()
    while true do
        if inArena then
            Wait(0)
            PE.Text(0.5, 0.96, 'ARENA PVP  |  /sairarena  |  /ranking', 0.38, { 255, 120, 120, 255 }, { center = true })
        else
            Wait(1000)
        end
    end
end)

AddEventHandler('onResourceStop', function(r)
    if r == GetCurrentResourceName() and inArena then RemoveAllPedWeapons(PlayerPedId(), true) end
end)
