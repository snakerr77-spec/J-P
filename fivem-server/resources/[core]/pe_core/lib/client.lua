-- Biblioteca compartilhada (client). Incluída pelos outros resources com:
--   client_script '@pe_core/lib/client.lua'
PE = PE or {}
PE.Data = nil
PE.busy = false

-- dados do jogador ------------------------------------------------------
RegisterNetEvent('pe:client:update', function(d) PE.Data = d end)

CreateThread(function()
    while not PE.Data do
        local ok, d = pcall(function() return exports.pe_core:GetData() end)
        if ok and d then PE.Data = d end
        Wait(500)
    end
end)

function PE.Job() return (PE.Data and PE.Data.job) or { name = 'desempregado', grade = 0, duty = false } end
function PE.IsJob(name, duty)
    local j = PE.Job()
    return j.name == name and (not duty or j.duty == true)
end
function PE.ItemLabel(name) return exports.pe_core:ItemLabel(name) or name end
function PE.ItemCount(name) return (PE.Data and PE.Data.inv and PE.Data.inv[name]) or 0 end

-- interface -------------------------------------------------------------
function PE.Notify(msg)
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName(msg)
    EndTextCommandThefeedPostTicker(false, true)
end

function PE.Help(text)
    BeginTextCommandDisplayHelp('STRING')
    AddTextComponentSubstringPlayerName(text)
    EndTextCommandDisplayHelp(0, false, true, -1)
end

function PE.Text(x, y, text, scale, col, opts)
    col = col or { 255, 255, 255, 255 }
    opts = opts or {}
    SetTextFont(opts.font or 4)
    SetTextScale(0.0, scale or 0.4)
    SetTextColour(col[1], col[2], col[3], col[4] or 255)
    SetTextOutline()
    if opts.center then SetTextCentre(true) end
    if opts.right then SetTextRightJustify(true); SetTextWrap(0.0, x) end
    BeginTextCommandDisplayText('STRING')
    AddTextComponentSubstringPlayerName(text)
    EndTextCommandDisplayText(x, y)
end

function PE.Blip(coords, sprite, color, label, scale)
    local b = AddBlipForCoord(coords.x, coords.y, coords.z)
    SetBlipSprite(b, sprite)
    SetBlipColour(b, color)
    SetBlipScale(b, scale or 0.8)
    SetBlipAsShortRange(b, true)
    BeginTextCommandSetBlipName('STRING')
    AddTextComponentSubstringPlayerName(label)
    EndTextCommandSetBlipName(b)
    return b
end

function PE.Menu(title, items, cb)
    PE.busy = true
    exports.pe_menu:Open(title, items, function(i, item)
        PE.busy = false
        if cb then CreateThread(function() cb(i, item) end) end
    end, function() PE.busy = false end)
end

function PE.Input(title, placeholder, cb)
    PE.busy = true
    exports.pe_menu:Input(title, placeholder, function(v)
        PE.busy = false
        if cb then CreateThread(function() cb(v) end) end
    end, function() PE.busy = false end)
end

-- carregamento ----------------------------------------------------------
function PE.LoadModel(model)
    local hash = type(model) == 'number' and model or joaat(model)
    if not IsModelInCdimage(hash) then return nil end
    RequestModel(hash)
    local t = 0
    while not HasModelLoaded(hash) and t < 100 do Wait(50); t = t + 1 end
    return HasModelLoaded(hash) and hash or nil
end

function PE.LoadAnim(dict)
    RequestAnimDict(dict)
    local t = 0
    while not HasAnimDictLoaded(dict) and t < 100 do Wait(50); t = t + 1 end
    return HasAnimDictLoaded(dict)
end

function PE.Ped(model, coords, heading, scenario)
    local hash = PE.LoadModel(model)
    if not hash then return nil end
    local ped = CreatePed(4, hash, coords.x, coords.y, coords.z - 1.0, heading or 0.0, false, false)
    SetEntityInvincible(ped, true)
    SetBlockingOfNonTemporaryEvents(ped, true)
    FreezeEntityPosition(ped, true)
    if scenario then TaskStartScenarioInPlace(ped, scenario, 0, true) end
    SetModelAsNoLongerNeeded(hash)
    return ped
end

function PE.SpawnVehicle(model, at, plate)
    local hash = PE.LoadModel(model)
    if not hash then PE.Notify('Modelo indisponível: ' .. tostring(model)); return nil end
    if IsAnyVehicleNearPoint(at.x, at.y, at.z, 3.0) then
        PE.Notify('O local de saída está ocupado.')
        return nil
    end
    local veh = CreateVehicle(hash, at.x, at.y, at.z, at.w or 0.0, true, false)
    SetModelAsNoLongerNeeded(hash)
    SetEntityAsMissionEntity(veh, true, true)
    SetVehicleOnGroundProperly(veh)
    SetVehicleHasBeenOwnedByPlayer(veh, true)
    if plate then SetVehicleNumberPlateText(veh, plate) end
    SetPedIntoVehicle(PlayerPedId(), veh, -1)
    return veh
end

function PE.Teleport(c)
    local ped = PlayerPedId()
    DoScreenFadeOut(300)
    while not IsScreenFadedOut() do Wait(0) end
    RequestCollisionAtCoord(c.x, c.y, c.z)
    SetEntityCoords(ped, c.x, c.y, c.z, false, false, false, false)
    local t = 0
    while not HasCollisionLoadedAroundEntity(ped) and t < 50 do Wait(100); t = t + 1 end
    if c.w then SetEntityHeading(ped, c.w) end
    DoScreenFadeIn(300)
end

function PE.ClosestPlayer(dist)
    local pc = GetEntityCoords(PlayerPedId())
    local best, bd = nil, dist or 3.0
    for _, pid in ipairs(GetActivePlayers()) do
        if pid ~= PlayerId() then
            local d = #(GetEntityCoords(GetPlayerPed(pid)) - pc)
            if d < bd then best, bd = GetPlayerServerId(pid), d end
        end
    end
    return best
end

-- barra de progresso ----------------------------------------------------
function PE.Progress(label, ms, anim)
    local ped = PlayerPedId()
    PE.busy = true
    if anim and PE.LoadAnim(anim[1]) then
        TaskPlayAnim(ped, anim[1], anim[2], 8.0, -8.0, -1, 49, 0, false, false, false)
    end
    local start, ok = GetGameTimer(), true
    while GetGameTimer() - start < ms do
        Wait(0)
        if IsEntityDead(PlayerPedId()) then ok = false; break end
        local p = (GetGameTimer() - start) / ms
        DrawRect(0.5, 0.93, 0.2, 0.02, 0, 0, 0, 170)
        DrawRect(0.4 + 0.1 * p, 0.93, 0.2 * p, 0.02, 46, 204, 113, 220)
        PE.Text(0.5, 0.895, label, 0.38, nil, { center = true })
    end
    ClearPedTasks(PlayerPedId())
    PE.busy = false
    return ok
end

-- zonas de interação ----------------------------------------------------
-- { coords, radius, label, action(z), canUse(), vehicle=true|false|nil, marker=false, color={r,g,b} }
PE.zones = {}
function PE.Zone(z)
    z.radius = z.radius or 1.5
    PE.zones[#PE.zones + 1] = z
    return z
end

CreateThread(function()
    while true do
        local sleep = 800
        local ped = PlayerPedId()
        local pc = GetEntityCoords(ped)
        local inVeh = IsPedInAnyVehicle(ped, false)
        for i = 1, #PE.zones do
            local z = PE.zones[i]
            local dx, dy = pc.x - z.coords.x, pc.y - z.coords.y
            local dist = math.sqrt(dx * dx + dy * dy)
            if dist < 20.0 and math.abs(pc.z - z.coords.z) < 8.0 and (not z.canUse or z.canUse()) then
                sleep = 0
                local okVeh = (z.vehicle == nil) or (z.vehicle == inVeh)
                if z.marker ~= false and okVeh then
                    local c = z.color or { 46, 204, 113 }
                    DrawMarker(1, z.coords.x, z.coords.y, pc.z - 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                        z.radius * 1.4, z.radius * 1.4, 0.6, c[1], c[2], c[3], 110, false, false, 2, false, nil, nil, false)
                end
                if okVeh and dist < z.radius and not PE.busy then
                    PE.Help('~INPUT_CONTEXT~ ' .. z.label)
                    if IsControlJustReleased(0, 38) and z.action then z.action(z) end
                end
            end
        end
        Wait(sleep)
    end
end)

-- callbacks servidor ----------------------------------------------------
local cbCounter = 0
function PE.Callback(name, cb, ...)
    cbCounter = cbCounter + 1
    local id, res = cbCounter, GetCurrentResourceName()
    local evt = ('pe:cbr:%s:%d'):format(res, id)
    RegisterNetEvent(evt)
    local h
    h = AddEventHandler(evt, function(...)
        RemoveEventHandler(h)
        cb(...)
    end)
    TriggerServerEvent('pe:cb:' .. name, id, res, ...)
end
