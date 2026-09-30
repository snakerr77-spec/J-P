local cache = {}

local function vehiclesOf(src)
    local id = PE.Identifier(src)
    if not id then return nil end
    if not cache[id] then
        local raw = GetResourceKvpString('veh:' .. id)
        cache[id] = raw and json.decode(raw) or {}
    end
    return cache[id], id
end

local function save(id) SetResourceKvp('veh:' .. id, json.encode(cache[id])) end

local function findVehicle(list, plate)
    for _, v in ipairs(list) do if v.plate == plate then return v end end
end

local function sendOwned(src)
    local list = vehiclesOf(src)
    if not list then return end
    local plates = {}
    for _, v in ipairs(list) do plates[#plates + 1] = v.plate end
    TriggerClientEvent('pe_garage:client:owned', src, plates)
end

local function newPlate(list)
    local chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
    while true do
        local p = 'PE'
        for _ = 1, 6 do
            local i = math.random(#chars)
            p = p .. chars:sub(i, i)
        end
        local used = false
        for _, l in pairs(cache) do if findVehicle(l, p) then used = true break end end
        if not used then return p end
    end
end

local function priceOf(model)
    for _, cat in pairs(Config.Catalog) do
        for _, c in ipairs(cat.cars) do if c[1] == model then return c[3], c[2] end end
    end
end

RegisterNetEvent('pe_garage:requestOwned', function() sendOwned(source) end)

RegisterNetEvent('pe_garage:buy', function(dealerIdx, catKey, carIdx)
    local src = source
    local dealer = Config.Dealers[tonumber(dealerIdx) or 0]
    if not dealer or not PE.Near(src, dealer.coords, 10.0) then return end
    local allowed = false
    for _, c in ipairs(dealer.categories) do if c == catKey then allowed = true end end
    local cat = allowed and Config.Catalog[catKey]
    local car = cat and cat.cars[tonumber(carIdx) or 0]
    if not car then return end
    local list, id = vehiclesOf(src)
    if not list then return end
    if #list >= 25 then return PE.Notify(src, 'Você atingiu o limite de veículos.') end
    if not PE.Pay(src, car[3]) then return PE.Notify(src, 'Dinheiro insuficiente.') end
    local plate = newPlate(list)
    list[#list + 1] = { plate = plate, model = car[1], label = car[2], stored = false, props = {} }
    save(id)
    PE.Notify(src, ('Você comprou um %s por $%d.'):format(car[2], car[3]))
    TriggerClientEvent('pe_garage:client:spawn', src, { model = car[1], plate = plate, props = {}, spawn = dealer.spawn })
    sendOwned(src)
end)

PE.Callback('pe_garage:list', function(src)
    local list = vehiclesOf(src) or {}
    return list
end)

RegisterNetEvent('pe_garage:retrieve', function(garageIdx, plate)
    local src = source
    local g = Config.Garages[tonumber(garageIdx) or 0]
    if not g or not PE.Near(src, g.coords, 12.0) then return end
    local list, id = vehiclesOf(src)
    local v = list and findVehicle(list, plate)
    if not v then return end
    if not v.stored and not PE.Pay(src, Config.ImpoundFee) then
        return PE.Notify(src, ('Taxa de pátio: $%d. Dinheiro insuficiente.'):format(Config.ImpoundFee))
    end
    v.stored = false
    save(id)
    TriggerClientEvent('pe_garage:client:spawn', src, { model = v.model, plate = v.plate, props = v.props, spawn = g.spawn })
end)

RegisterNetEvent('pe_garage:store', function(garageIdx, plate, props)
    local src = source
    local g = Config.Garages[tonumber(garageIdx) or 0]
    if not g or not PE.Near(src, g.coords, 12.0) then return end
    local list, id = vehiclesOf(src)
    local v = list and findVehicle(list, plate)
    if not v then return PE.Notify(src, 'Esse veículo não é seu.') end
    v.stored = true
    if type(props) == 'table' then v.props = props end
    save(id)
    TriggerClientEvent('pe_garage:client:stored', src)
    PE.Notify(src, 'Veículo guardado.')
end)

-- tuning ---------------------------------------------------------------------------------
local function nearWorkshop(src)
    for _, c in ipairs(Config.Workshops) do if PE.Near(src, c, 12.0) then return true end end
    return false
end

local function discount(src, price)
    if PE.IsJob(src, 'mecanico', true) then price = math.floor(price * (1 - Config.MechanicDiscount)) end
    return price
end

RegisterNetEvent('pe_garage:tune', function(tuneId, level, plate)
    local src = source
    if not nearWorkshop(src) then return end
    local t
    for _, x in ipairs(Config.Tuning) do if x.id == tuneId then t = x end end
    level = tonumber(level) or 0
    local price = t and t.prices[level]
    if not price then return end
    price = discount(src, price)
    if not PE.Pay(src, price) then return PE.Notify(src, 'Dinheiro insuficiente.') end
    TriggerClientEvent('pe_garage:client:applyTune', src, tuneId, level)
    PE.Notify(src, ('%s instalado por $%d.'):format(t.label, price))
end)

RegisterNetEvent('pe_garage:paint', function(colorIdx)
    local src = source
    local c = Config.Colors[tonumber(colorIdx) or 0]
    if not c or not nearWorkshop(src) then return end
    local price = discount(src, Config.PaintPrice)
    if not PE.Pay(src, price) then return PE.Notify(src, 'Dinheiro insuficiente.') end
    TriggerClientEvent('pe_garage:client:applyPaint', src, c[2])
    PE.Notify(src, ('Pintura %s por $%d.'):format(c[1], price))
end)

RegisterNetEvent('pe_garage:repair', function()
    local src = source
    if not nearWorkshop(src) then return end
    local price = discount(src, Config.RepairPrice)
    if not PE.Pay(src, price) then return PE.Notify(src, 'Dinheiro insuficiente.') end
    TriggerClientEvent('pe_garage:client:applyRepair', src)
    PE.Notify(src, ('Reparo completo por $%d.'):format(price))
end)

RegisterNetEvent('pe_garage:saveProps', function(plate, props)
    local src = source
    local list, id = vehiclesOf(src)
    local v = list and findVehicle(list, plate)
    if v and type(props) == 'table' then v.props = props; save(id) end
end)
