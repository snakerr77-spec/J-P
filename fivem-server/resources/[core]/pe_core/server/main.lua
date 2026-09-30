local Players = {}

local function identifierOf(src)
    for _, id in ipairs(GetPlayerIdentifiers(src)) do
        if id:sub(1, 8) == 'license:' then return id end
    end
    return 'temp:' .. src
end

local function newData(src)
    return {
        name = GetPlayerName(src), cash = Config.StartCash, bank = Config.StartBank,
        job = { name = 'desempregado', grade = 0, duty = false }, inv = {},
        meta = { hunger = 100, thirst = 100, jail = 0, license_arma = false },
    }
end

local function applyState(src)
    local p = Players[src]
    if not p then return end
    local st = Player(src).state
    st:set('job', p.data.job.name, true)
    st:set('duty', p.data.job.duty == true, true)
end

local function sync(src)
    local p = Players[src]
    if p then TriggerClientEvent('pe:client:update', src, p.data) end
end

local function savePlayer(src)
    local p = Players[src]
    if p then SetResourceKvp('player:' .. p.id, json.encode(p.data)) end
end

local function loadPlayer(src)
    if Players[src] then return end
    local id = identifierOf(src)
    local raw = GetResourceKvpString('player:' .. id)
    local data = raw and json.decode(raw) or nil
    local base = newData(src)
    if data then
        for k, v in pairs(base) do if data[k] == nil then data[k] = v end end
        for k, v in pairs(base.meta) do if data.meta[k] == nil then data.meta[k] = v end end
        data.name = base.name
        if not Config.Jobs[data.job.name] or not Config.Jobs[data.job.name].grades[data.job.grade] then
            data.job = base.job
        end
    else
        data = base
    end
    Players[src] = { id = id, data = data }
    applyState(src)
    sync(src)
end

local function amountOf(a) return math.floor(tonumber(a) or 0) end

-- dinheiro -----------------------------------------------------------------
local function addMoney(src, acct, n)
    local p, amt = Players[src], amountOf(n)
    if not p or amt <= 0 or (acct ~= 'cash' and acct ~= 'bank') then return false end
    p.data[acct] = p.data[acct] + amt
    sync(src)
    return true
end

local function removeMoney(src, acct, n)
    local p, amt = Players[src], amountOf(n)
    if not p or amt <= 0 or (acct ~= 'cash' and acct ~= 'bank') or p.data[acct] < amt then return false end
    p.data[acct] = p.data[acct] - amt
    sync(src)
    return true
end

local function pay(src, n)
    local p, amt = Players[src], amountOf(n)
    if not p or amt <= 0 or p.data.cash + p.data.bank < amt then return false end
    local fromCash = math.min(p.data.cash, amt)
    p.data.cash = p.data.cash - fromCash
    p.data.bank = p.data.bank - (amt - fromCash)
    sync(src)
    return true
end

-- itens --------------------------------------------------------------------
local function addItem(src, item, n)
    local p, cnt = Players[src], amountOf(n or 1)
    if not p or cnt <= 0 or not Config.Items[item] then return false end
    p.data.inv[item] = (p.data.inv[item] or 0) + cnt
    sync(src)
    return true
end

local function removeItem(src, item, n)
    local p, cnt = Players[src], amountOf(n or 1)
    if not p or cnt <= 0 or (p.data.inv[item] or 0) < cnt then return false end
    local left = p.data.inv[item] - cnt
    p.data.inv[item] = left > 0 and left or nil
    sync(src)
    return true
end

local function itemCount(src, item)
    local p = Players[src]
    return p and p.data.inv[item] or 0
end

-- empregos -----------------------------------------------------------------
local function stripJobItems(src)
    local p = Players[src]
    if not p then return end
    for item, count in pairs(p.data.inv) do
        local def = Config.Items[item]
        if def and def.jobOnly == p.data.job.name then p.data.inv[item] = nil end
    end
end

local function setJob(src, name, grade)
    local p, def = Players[src], Config.Jobs[name]
    grade = math.floor(tonumber(grade) or 0)
    if not p or not def or not def.grades[grade] then return false end
    stripJobItems(src)
    p.data.job = { name = name, grade = grade, duty = not def.duty }
    applyState(src)
    sync(src)
    return true
end

local function setDuty(src, on)
    local p = Players[src]
    if not p then return false end
    local def = Config.Jobs[p.data.job.name]
    if not def or not def.duty then return false end
    if not on then stripJobItems(src) end
    p.data.job.duty = on and true or false
    applyState(src)
    sync(src)
    return true
end

-- exports ------------------------------------------------------------------
exports('GetPlayer', function(src) local p = Players[src]; return p and p.data end)
exports('GetIdentifier', function(src) local p = Players[src]; return p and p.id end)
exports('GetMoney', function(src, acct) local p = Players[src]; return p and p.data[acct] or 0 end)
exports('ItemDef', function(n) return Config.Items[n] end)
exports('AddMoney', addMoney)
exports('RemoveMoney', removeMoney)
exports('Pay', pay)
exports('AddItem', addItem)
exports('RemoveItem', removeItem)
exports('ItemCount', itemCount)
exports('SetJob', setJob)
exports('SetDuty', setDuty)
exports('IsAdmin', function(src) return src == 0 or IsPlayerAceAllowed(src, 'pe.admin') end)
exports('GetMeta', function(src, key) local p = Players[src]; return p and p.data.meta[key] end)
exports('SetMeta', function(src, key, val)
    local p = Players[src]
    if not p then return false end
    p.data.meta[key] = val
    sync(src)
    return true
end)
exports('GetJobPlayers', function(name, dutyOnly)
    local list = {}
    for src, p in pairs(Players) do
        if p.data.job.name == name and (not dutyOnly or p.data.job.duty) then list[#list + 1] = src end
    end
    return list
end)

local function isAdmin(src) return src == 0 or IsPlayerAceAllowed(src, 'pe.admin') end
local function notify(src, msg) if src ~= 0 then TriggerClientEvent('pe:notify', src, msg) else print(msg) end end

-- ciclo de vida ---------------------------------------------------------------
RegisterNetEvent('pe:server:ready', function() loadPlayer(source) end)

AddEventHandler('playerDropped', function()
    local src = source
    savePlayer(src)
    Players[src] = nil
end)

AddEventHandler('onResourceStart', function(res)
    if res ~= GetCurrentResourceName() then return end
    for _, id in ipairs(GetPlayers()) do loadPlayer(tonumber(id)) end
end)

AddEventHandler('onResourceStop', function(res)
    if res ~= GetCurrentResourceName() then return end
    for src in pairs(Players) do savePlayer(src) end
end)

CreateThread(function()
    while true do
        Wait(60000)
        for src in pairs(Players) do savePlayer(src) end
    end
end)

-- meta vindo do client (somente chaves seguras) --------------------------------
RegisterNetEvent('pe:server:setMeta', function(key, value)
    local src = source
    local p = Players[src]
    if not p then return end
    if key == 'model' then
        for _, m in ipairs(Config.Models) do
            if m[1] == value then p.data.meta.model = value; sync(src); return end
        end
    elseif key == 'pos' and type(value) == 'table' then
        local x, y, z, w = tonumber(value.x), tonumber(value.y), tonumber(value.z), tonumber(value.w)
        if x and y and z then p.data.meta.pos = { x = x, y = y, z = z, w = w or 0.0 } end
    end
end)

-- uso de itens ----------------------------------------------------------------
RegisterNetEvent('pe:server:useItem', function(item)
    local src = source
    local p, def = Players[src], Config.Items[item]
    if not p or not def or itemCount(src, item) <= 0 then return end
    if def.food then
        removeItem(src, item, 1)
        local m = p.data.meta
        m.hunger = math.min(100, (m.hunger or 100) + (def.food.hunger or 0))
        m.thirst = math.min(100, (m.thirst or 100) + (def.food.thirst or 0))
        sync(src)
        TriggerClientEvent('pe:client:consume', src, def.food.thirst and 'drink' or 'eat')
    elseif def.weapon then
        TriggerClientEvent('pe:client:giveWeapon', src, def.weapon)
    elseif def.ammo then
        TriggerClientEvent('pe:client:addAmmo', src, def.ammo)
    elseif def.event then
        TriggerClientEvent(def.event, src, item)
    else
        notify(src, 'Esse item não pode ser usado.')
    end
end)

-- itens de uso único consumidos depois que o client confirma o efeito
local consumable = { kit_medico = true, colete = true, kit_reparo = true, municao = true }
RegisterNetEvent('pe:server:consume', function(item)
    if consumable[item] then removeItem(source, item, 1) end
end)

RegisterNetEvent('pe:server:giveItem', function(target, item, qty)
    local src, tgt = source, tonumber(target)
    qty = amountOf(qty)
    if not tgt or not Players[tgt] or tgt == src or qty <= 0 then return end
    if not PE_Near(src, tgt) then return notify(src, 'Ninguém por perto.') end
    if itemCount(src, item) < qty then return notify(src, 'Você não tem essa quantidade.') end
    removeItem(src, item, qty)
    addItem(tgt, item, qty)
    notify(src, ('Você entregou %dx %s.'):format(qty, Config.Items[item].label))
    notify(tgt, ('Você recebeu %dx %s.'):format(qty, Config.Items[item].label))
end)

RegisterNetEvent('pe:server:dropItem', function(item, qty)
    qty = amountOf(qty)
    if qty > 0 and Config.Items[item] and removeItem(source, item, qty) then
        notify(source, ('Você jogou fora %dx %s.'):format(qty, Config.Items[item].label))
    end
end)

function PE_Near(a, b)
    return #(GetEntityCoords(GetPlayerPed(a)) - GetEntityCoords(GetPlayerPed(b))) <= 4.0
end

-- necessidades, salário -------------------------------------------------------------
CreateThread(function()
    while true do
        Wait(60000)
        if Config.NeedsEnabled then
            for src, p in pairs(Players) do
                p.data.meta.hunger = math.max(0, (p.data.meta.hunger or 100) - 1.2)
                p.data.meta.thirst = math.max(0, (p.data.meta.thirst or 100) - 1.8)
                sync(src)
            end
        end
    end
end)

CreateThread(function()
    while true do
        Wait(Config.PayInterval * 60000)
        for src, p in pairs(Players) do
            local job = p.data.job
            local def = Config.Jobs[job.name]
            local amount = 0
            if job.name == 'desempregado' then
                amount = Config.UnemployedPay
            elseif def and def.grades[job.grade] and (not def.duty or job.duty) then
                amount = def.grades[job.grade].pay
            end
            if amount > 0 then
                addMoney(src, 'bank', amount)
                notify(src, ('Salário de $%d depositado no banco.'):format(amount))
            end
        end
    end
end)

-- comandos -------------------------------------------------------------------------
local function nearby(src, dist, fn)
    local sc = GetEntityCoords(GetPlayerPed(src))
    for _, id in ipairs(GetPlayers()) do
        id = tonumber(id)
        if #(GetEntityCoords(GetPlayerPed(id)) - sc) <= dist then fn(id) end
    end
end

local function say(tag, color, src, text)
    local name = Players[src] and Players[src].data.name or GetPlayerName(src)
    nearby(src, 20.0, function(id)
        TriggerClientEvent('chat:addMessage', id, { color = color, args = { tag .. ' ' .. name, text } })
    end)
end

RegisterCommand('me', function(src, args)
    if src ~= 0 and #args > 0 then say('*', { 255, 120, 255 }, src, table.concat(args, ' ')) end
end)
RegisterCommand('do', function(src, args)
    if src ~= 0 and #args > 0 then say('**', { 120, 200, 255 }, src, table.concat(args, ' ')) end
end)
RegisterCommand('ooc', function(src, args)
    if src ~= 0 and #args > 0 then say('[OOC]', { 180, 180, 180 }, src, table.concat(args, ' ')) end
end)
RegisterCommand('id', function(src) notify(src, 'Seu ID: ' .. src) end)

RegisterCommand('pagar', function(src, args)
    local tgt, amt = tonumber(args[1]), amountOf(args[2])
    if src == 0 or not tgt or amt <= 0 or tgt == src or not Players[tgt] then
        return notify(src, 'Use: /pagar [id] [valor]')
    end
    if not PE_Near(src, tgt) then return notify(src, 'Chegue mais perto da pessoa.') end
    if removeMoney(src, 'cash', amt) then
        addMoney(tgt, 'cash', amt)
        notify(src, ('Você pagou $%d.'):format(amt))
        notify(tgt, ('Você recebeu $%d.'):format(amt))
    else
        notify(src, 'Dinheiro em mãos insuficiente.')
    end
end)

RegisterCommand('contratar', function(src, args)
    local p = Players[src]
    if not p then return end
    local def = Config.Jobs[p.data.job.name]
    if not def or not def.boss or p.data.job.grade < def.boss then return notify(src, 'Você não pode contratar.') end
    local tgt, grade = tonumber(args[1]), tonumber(args[2]) or 0
    if not tgt or not Players[tgt] then return notify(src, 'Use: /contratar [id] [grade]') end
    if grade > p.data.job.grade then grade = p.data.job.grade end
    if setJob(tgt, p.data.job.name, grade) then
        notify(src, 'Contratado.')
        notify(tgt, ('Você foi contratado: %s (%s).'):format(def.label, def.grades[grade].label))
    end
end)

RegisterCommand('demitir', function(src, args)
    local p = Players[src]
    if not p then return end
    local def = Config.Jobs[p.data.job.name]
    local tgt = tonumber(args[1])
    if not def or not def.boss or p.data.job.grade < def.boss or not tgt or not Players[tgt] then
        return notify(src, 'Use: /demitir [id] (apenas chefes)')
    end
    if Players[tgt].data.job.name ~= p.data.job.name or Players[tgt].data.job.grade >= p.data.job.grade then
        return notify(src, 'Você não pode demitir essa pessoa.')
    end
    setJob(tgt, 'desempregado', 0)
    notify(tgt, 'Você foi demitido.')
    notify(src, 'Demitido.')
end)

RegisterCommand('setjob', function(src, args)
    if not isAdmin(src) then return end
    local tgt = tonumber(args[1])
    if tgt and Players[tgt] and setJob(tgt, args[2] or '', args[3] or 0) then
        notify(src, 'Emprego definido.')
        notify(tgt, 'Seu emprego foi alterado por um administrador.')
    else
        notify(src, 'Use: /setjob [id] [emprego] [grade]')
    end
end)
