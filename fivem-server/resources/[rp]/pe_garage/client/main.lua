local owned = {}
local MODS = { 11, 12, 13, 15, 16 }

local function trim(s)
    local r = (s or ''):gsub('^%s+', ''):gsub('%s+$', '')
    return r
end

exports('IsOwned', function(plate) return owned[trim(plate)] == true end)

RegisterNetEvent('pe_garage:client:owned', function(plates)
    owned = {}
    for _, p in ipairs(plates) do owned[p] = true end
end)
AddEventHandler('pe:spawned', function() TriggerServerEvent('pe_garage:requestOwned') end)
CreateThread(function() Wait(3000); TriggerServerEvent('pe_garage:requestOwned') end)

-- propriedades do veículo ----------------------------------------------------------------
local function getProps(veh)
    SetVehicleModKit(veh, 0)
    local c1, c2 = GetVehicleColours(veh)
    local mods = {}
    for _, m in ipairs(MODS) do mods[tostring(m)] = GetVehicleMod(veh, m) end
    return { c1 = c1, c2 = c2, mods = mods, turbo = IsToggleModOn(veh, 18), bp = Entity(veh).state.bulletproofTires == true }
end

local function applyProps(veh, p)
    if not p or not p.c1 then return end
    SetVehicleModKit(veh, 0)
    SetVehicleColours(veh, p.c1, p.c2 or p.c1)
    for k, v in pairs(p.mods or {}) do SetVehicleMod(veh, tonumber(k), v, false) end
    ToggleVehicleMod(veh, 18, p.turbo == true)
    if p.bp then SetVehicleTyresCanBurst(veh, false); Entity(veh).state:set('bulletproofTires', true, true) end
end

local function plateOf(veh) return trim(GetVehicleNumberPlateText(veh)) end

RegisterNetEvent('pe_garage:client:spawn', function(d)
    local veh = PE.SpawnVehicle(d.model, d.spawn, d.plate)
    if veh then applyProps(veh, d.props) end
end)

-- concessionárias ------------------------------------------------------------------------
local function openCategory(di, catKey)
    local cat = Config.Catalog[catKey]
    local items = {}
    for _, c in ipairs(cat.cars) do items[#items + 1] = { label = c[2], right = '$' .. c[3] } end
    PE.Menu(cat.label, items, function(i)
        TriggerServerEvent('pe_garage:buy', di, catKey, i)
    end)
end

local function openDealer(di)
    local d = Config.Dealers[di]
    local items = {}
    for _, k in ipairs(d.categories) do items[#items + 1] = { label = Config.Catalog[k].label } end
    PE.Menu(d.name, items, function(i) openCategory(di, d.categories[i]) end)
end

for di, d in ipairs(Config.Dealers) do
    PE.Blip(d.coords, d.blip[1], d.blip[2], d.name, 0.85)
    PE.Zone({ coords = d.coords, label = 'Ver veículos - ' .. d.name, radius = 2.0, vehicle = false,
        color = { 241, 196, 15 }, action = function() openDealer(di) end })
end

-- garagens -------------------------------------------------------------------------------
local function openGarage(gi)
    PE.Callback('pe_garage:list', function(list)
        local items = { { label = 'Guardar veículo atual', desc = 'Você precisa estar dentro do veículo' } }
        for _, v in ipairs(list) do
            items[#items + 1] = { label = v.label or v.model, right = v.plate,
                desc = v.stored and 'Guardado' or ('Na rua (pátio $%d)'):format(Config.ImpoundFee) }
        end
        PE.Menu(Config.Garages[gi].name, items, function(i)
            if i == 1 then
                local veh = GetVehiclePedIsIn(PlayerPedId(), false)
                if veh == 0 then return PE.Notify('Entre no veículo que deseja guardar.') end
                local plate = plateOf(veh)
                if not owned[plate] then return PE.Notify('Esse veículo não é seu.') end
                TriggerServerEvent('pe_garage:store', gi, plate, getProps(veh))
                SetTimeout(400, function() if DoesEntityExist(veh) then DeleteEntity(veh) end end)
            else
                TriggerServerEvent('pe_garage:retrieve', gi, list[i - 1].plate)
            end
        end)
    end)
end

for gi, g in ipairs(Config.Garages) do
    PE.Blip(g.coords, 357, 3, g.name, 0.75)
    PE.Zone({ coords = g.coords, label = 'Abrir garagem', radius = 2.5, color = { 52, 152, 219 }, action = function() openGarage(gi) end })
end
RegisterNetEvent('pe_garage:client:stored', function() end)

-- trava (tecla L) ------------------------------------------------------------------------
RegisterCommand('travar', function()
    local ped = PlayerPedId()
    local c = GetEntityCoords(ped)
    local veh = GetVehiclePedIsIn(ped, false)
    if veh == 0 then veh = GetClosestVehicle(c.x, c.y, c.z, 6.0, 0, 71) end
    if veh == 0 or not owned[plateOf(veh)] then return PE.Notify('Nenhum veículo seu por perto.') end
    local locked = GetVehicleDoorLockStatus(veh) > 1
    SetVehicleDoorsLocked(veh, locked and 1 or 2)
    SetVehicleLights(veh, 2)
    SetTimeout(250, function() SetVehicleLights(veh, 0) end)
    PE.Notify(locked and 'Veículo destrancado.' or 'Veículo trancado.')
end, false)
RegisterKeyMapping('travar', 'Trancar/destrancar veículo', 'keyboard', 'L')

-- oficina --------------------------------------------------------------------------------
local function currentVeh()
    local veh = GetVehiclePedIsIn(PlayerPedId(), false)
    if veh == 0 or GetPedInVehicleSeat(veh, -1) ~= PlayerPedId() then return nil end
    return veh
end

local function openTuning()
    local veh = currentVeh()
    if not veh then return PE.Notify('Dirija o veículo até a oficina.') end
    local items = {}
    for _, t in ipairs(Config.Tuning) do items[#items + 1] = { label = t.label, desc = 'Até ' .. #t.prices .. ' nível(is)' } end
    items[#items + 1] = { label = 'Pintura', right = '$' .. Config.PaintPrice }
    items[#items + 1] = { label = 'Reparo completo', right = '$' .. Config.RepairPrice }
    PE.Menu('Oficina', items, function(i)
        local t = Config.Tuning[i]
        if t then
            local lv = {}
            for n, price in ipairs(t.prices) do lv[#lv + 1] = { label = t.toggle and 'Instalar' or ('Nível ' .. n), right = '$' .. price } end
            PE.Menu(t.label, lv, function(n) TriggerServerEvent('pe_garage:tune', t.id, n, plateOf(veh)) end)
        elseif i == #Config.Tuning + 1 then
            local cs = {}
            for _, c in ipairs(Config.Colors) do cs[#cs + 1] = { label = c[1] } end
            PE.Menu('Cor', cs, function(n) TriggerServerEvent('pe_garage:paint', n) end)
        else
            TriggerServerEvent('pe_garage:repair')
        end
    end)
end

for _, c in ipairs(Config.Workshops) do
    PE.Blip(c, 72, 5, 'Oficina', 0.8)
    PE.Zone({ coords = c, label = 'Usar a oficina', radius = 3.0, vehicle = true, color = { 230, 126, 34 }, action = openTuning })
end

RegisterNetEvent('pe_garage:client:applyTune', function(tuneId, level)
    local veh = currentVeh()
    if not veh then return end
    SetVehicleModKit(veh, 0)
    for _, t in ipairs(Config.Tuning) do
        if t.id == tuneId then
            if t.toggle then ToggleVehicleMod(veh, t.mod, true)
            elseif t.special == 'bulletproof' then
                SetVehicleTyresCanBurst(veh, false); Entity(veh).state:set('bulletproofTires', true, true)
            else SetVehicleMod(veh, t.mod, level - 1, false) end
        end
    end
    local plate = plateOf(veh)
    if owned[plate] then TriggerServerEvent('pe_garage:saveProps', plate, getProps(veh)) end
end)

RegisterNetEvent('pe_garage:client:applyPaint', function(color)
    local veh = currentVeh()
    if not veh then return end
    SetVehicleColours(veh, color, color)
    local plate = plateOf(veh)
    if owned[plate] then TriggerServerEvent('pe_garage:saveProps', plate, getProps(veh)) end
end)

RegisterNetEvent('pe_garage:client:applyRepair', function()
    local veh = currentVeh()
    if not veh then return end
    SetVehicleFixed(veh); SetVehicleDeformationFixed(veh); SetVehicleDirtLevel(veh, 0.0)
end)
