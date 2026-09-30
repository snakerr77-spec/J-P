-- comandos locais; o server confirma que é admin antes de liberar
local function guarded(kind, fn)
    RegisterNetEvent('pe_admin:do')
    AddEventHandler('pe_admin:do', function(k) if k == kind then fn() end end)
end

local function ask(kind) TriggerServerEvent('pe_admin:request', kind) end

RegisterNetEvent('pe_admin:tp', function(c)
    SetEntityCoords(PlayerPedId(), c.x, c.y, c.z, false, false, false, false)
end)

guarded('pos', function()
    local c, h = GetEntityCoords(PlayerPedId()), GetEntityHeading(PlayerPedId())
    local s = ('vec4(%.2f, %.2f, %.2f, %.1f)'):format(c.x, c.y, c.z, h)
    print('[pe_admin] ' .. s)
    TriggerEvent('chat:addMessage', { color = { 0, 255, 150 }, args = { 'POS', s } })
end)

guarded('tpm', function()
    local blip = GetFirstBlipInfoId(8)
    if not DoesBlipExist(blip) then return PE.Notify('Marque um ponto no mapa.') end
    local c = GetBlipInfoIdCoord(blip)
    local z = 1000.0
    for h = 1000, 0, -25 do
        RequestCollisionAtCoord(c.x, c.y, h + 0.0)
        Wait(10)
        local ok, gz = GetGroundZFor_3dCoord(c.x, c.y, h + 0.0, false)
        if ok then z = gz break end
    end
    SetEntityCoords(PlayerPedId(), c.x, c.y, z, false, false, false, false)
end)

local noclip = false
guarded('noclip', function()
    noclip = not noclip
    local ped = PlayerPedId()
    SetEntityInvincible(ped, noclip); SetEntityVisible(ped, not noclip, false); FreezeEntityPosition(ped, noclip)
    PE.Notify(noclip and 'Noclip ligado (WASD, Shift acelera, Ctrl desce, Espaço sobe)' or 'Noclip desligado')
    CreateThread(function()
        while noclip do
            Wait(0)
            local p = PlayerPedId()
            local speed = IsControlPressed(0, 21) and 2.5 or 0.6
            local c = GetEntityCoords(p)
            local fx, fy = -math.sin(math.rad(GetGameplayCamRelativeHeading() + GetEntityHeading(p))), math.cos(math.rad(GetGameplayCamRelativeHeading() + GetEntityHeading(p)))
            if IsControlPressed(0, 32) then c = c + vec3(fx, fy, 0.0) * speed end
            if IsControlPressed(0, 33) then c = c - vec3(fx, fy, 0.0) * speed end
            if IsControlPressed(0, 22) then c = c + vec3(0.0, 0.0, speed) end
            if IsControlPressed(0, 36) then c = c - vec3(0.0, 0.0, speed) end
            SetEntityCoordsNoOffset(p, c.x, c.y, c.z, true, true, true)
        end
        FreezeEntityPosition(PlayerPedId(), false)
    end)
end)

guarded('dv', function()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if veh == 0 then
        local c = GetEntityCoords(ped)
        veh = GetClosestVehicle(c.x, c.y, c.z, 5.0, 0, 71)
    end
    if veh ~= 0 then SetEntityAsMissionEntity(veh, true, true); DeleteEntity(veh) end
end)

local pendingCar
guarded('car', function()
    if pendingCar then PE.SpawnVehicle(pendingCar, vec4(GetEntityCoords(PlayerPedId()).x, GetEntityCoords(PlayerPedId()).y, GetEntityCoords(PlayerPedId()).z, GetEntityHeading(PlayerPedId())), 'ADMIN') end
end)

RegisterCommand('pos', function() ask('pos') end, false)
RegisterCommand('tpm', function() ask('tpm') end, false)
RegisterCommand('noclip', function() ask('noclip') end, false)
RegisterCommand('dv', function() ask('dv') end, false)
RegisterCommand('car', function(_, a)
    if a[1] then pendingCar = a[1]; ask('car') end
end, false)
