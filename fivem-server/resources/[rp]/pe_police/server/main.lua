local function isCop(src, duty) return PE.IsJob(src, 'policia', duty) end

local function alert(msg, x, y, z, code)
    for _, cop in ipairs(PE.JobPlayers('policia', true)) do
        TriggerClientEvent('pe_police:client:alert', cop, { msg = msg, x = x, y = y, z = z, code = code })
    end
end
exports('Alert', alert)

local function lockerNear(src)
    for _, st in ipairs(Config.Stations) do
        if PE.Near(src, st.locker, 8.0) then return true end
    end
    return false
end

RegisterNetEvent('pe_police:duty', function()
    local src = source
    if not isCop(src, false) or not lockerNear(src) then return end
    local on = not PE.Job(src).duty
    exports.pe_core:SetDuty(src, on)
    PE.Notify(src, on and 'Você entrou em serviço.' or 'Você saiu de serviço. Equipamentos devolvidos.')
end)

RegisterNetEvent('pe_police:armory', function(item)
    local src = source
    if not isCop(src, true) or not lockerNear(src) then return end
    for _, e in ipairs(Config.Armory) do
        if e.item == item then
            if PE.Job(src).grade < e.grade then return PE.Notify(src, 'Patente insuficiente.') end
            if PE.ItemCount(src, item) >= e.max then return PE.Notify(src, 'Você já tem o máximo desse item.') end
            PE.AddItem(src, item, 1)
            return PE.Notify(src, 'Retirado: ' .. PE.ItemDef(item).label)
        end
    end
end)

local function seizable(target, item)
    local def = PE.ItemDef(item)
    if not def or def.jobOnly then return false end
    if def.illegal then return true end
    return def.weapon ~= nil and not PE.Meta(target, 'license_arma')
end

local function amount(v) return math.floor(tonumber(v) or 0) end

RegisterNetEvent('pe_police:action', function(action, target, extra)
    local src, tgt = source, tonumber(target)
    if not isCop(src, true) then return end
    if not tgt or not PE.Player(tgt) or tgt == src or not PE.NearPlayer(src, tgt, 5.0) then
        return PE.Notify(src, 'Alvo inválido ou muito longe.')
    end
    local st = Player(tgt).state
    extra = type(extra) == 'table' and extra or {}

    if action == 'cuff' then
        local v = not st.cuffed
        st:set('cuffed', v, true)
        if not v then st:set('escort', false, true) end
        PE.Notify(src, v and 'Suspeito algemado.' or 'Suspeito solto.')
        PE.Notify(tgt, v and 'Você foi algemado.' or 'Você foi desalgemado.')
    elseif action == 'escort' then
        if not st.cuffed then return PE.Notify(src, 'O suspeito precisa estar algemado.') end
        if st.escort then st:set('escort', false, true) else st:set('escort', src, true) end
    elseif action == 'putveh' or action == 'outveh' then
        if action == 'putveh' then st:set('escort', false, true) end
        TriggerClientEvent('pe_police:client:' .. action, tgt)
    elseif action == 'search' then
        if not st.cuffed and not st.dead then return PE.Notify(src, 'O suspeito precisa estar algemado.') end
        local d, list = PE.Player(tgt), {}
        if d.cash > 0 then PE.Notify(src, ('Dinheiro em mãos: $%d'):format(d.cash)) end
        for name, count in pairs(d.inv) do
            local def = PE.ItemDef(name)
            if def then list[#list + 1] = { name = name, label = def.label, count = count, seizable = seizable(tgt, name) } end
        end
        table.sort(list, function(a, b) return a.label < b.label end)
        TriggerClientEvent('pe_police:client:search', src, tgt, list)
    elseif action == 'fine' then
        local a = math.min(amount(extra.amount), Config.MaxFine)
        if a <= 0 then return end
        local took = 0
        local cash = math.min(PE.Money(tgt, 'cash'), a)
        if cash > 0 and PE.RemoveMoney(tgt, 'cash', cash) then took = took + cash end
        local bank = math.min(PE.Money(tgt, 'bank'), a - took)
        if bank > 0 and PE.RemoveMoney(tgt, 'bank', bank) then took = took + bank end
        local reason = tostring(extra.reason or 'Infração'):sub(1, 60)
        PE.Notify(src, ('Multa de $%d aplicada.'):format(took))
        PE.Notify(tgt, ('Você recebeu uma multa de $%d: %s'):format(took, reason))
    elseif action == 'jail' then
        local m = math.max(1, math.min(amount(extra.minutes), Config.MaxJail))
        for item in pairs(PE.Player(tgt).inv) do
            if seizable(tgt, item) then PE.RemoveItem(tgt, item, PE.ItemCount(tgt, item)) end
        end
        st:set('cuffed', false, true)
        st:set('escort', false, true)
        PE.SetMeta(tgt, 'jail', m)
        TriggerClientEvent('pe_police:client:jail', tgt, m)
        PE.Notify(src, ('Suspeito preso por %d minuto(s).'):format(m))
    elseif action == 'id' then
        local d = PE.Player(tgt)
        TriggerClientEvent('pe_police:client:info', src, ('~b~%s~s~ | Porte: %s | Pena: %d min'):format(
            d.name, d.meta.license_arma and 'SIM' or 'NÃO', d.meta.jail or 0))
    elseif action == 'license' then
        if PE.Job(src).grade < Config.LicenseGrade then return PE.Notify(src, 'Patente insuficiente.') end
        local v = not PE.Meta(tgt, 'license_arma')
        PE.SetMeta(tgt, 'license_arma', v)
        PE.Notify(src, v and 'Porte de arma concedido.' or 'Porte de arma revogado.')
        PE.Notify(tgt, v and 'Você recebeu porte de arma.' or 'Seu porte de arma foi revogado.')
    end
end)

RegisterNetEvent('pe_police:confiscate', function(target, item)
    local src, tgt = source, tonumber(target)
    if not isCop(src, true) or not tgt or not PE.Player(tgt) or not PE.NearPlayer(src, tgt, 5.0) then return end
    if not seizable(tgt, item) then return end
    local n = PE.ItemCount(tgt, item)
    if n > 0 and PE.RemoveItem(tgt, item, n) then
        PE.Notify(src, ('Apreendido: %dx %s'):format(n, PE.ItemDef(item).label))
        PE.Notify(tgt, ('Um policial apreendeu %dx %s.'):format(n, PE.ItemDef(item).label))
    end
end)

-- prisão ----------------------------------------------------------------------------------------------------
RegisterNetEvent('pe_police:checkJail', function()
    local src = source
    local m = PE.Meta(src, 'jail') or 0
    if m > 0 then TriggerClientEvent('pe_police:client:jail', src, m) end
end)

CreateThread(function()
    while true do
        Wait(60000)
        for _, id in ipairs(GetPlayers()) do
            id = tonumber(id)
            local m = PE.Meta(id, 'jail') or 0
            if m > 0 then
                m = m - 1
                PE.SetMeta(id, 'jail', m)
                if m <= 0 then TriggerClientEvent('pe_police:client:release', id)
                else TriggerClientEvent('pe_police:client:jailTick', id, m) end
            end
        end
    end
end)

-- chamados ------------------------------------------------------------------------------------------------------
RegisterCommand('190', function(src, args)
    if src == 0 then return end
    local c = GetEntityCoords(GetPlayerPed(src))
    alert('Chamado de ' .. GetPlayerName(src) .. ': ' .. (#args > 0 and table.concat(args, ' ') or 'preciso de ajuda'), c.x, c.y, c.z, '190')
    PE.Notify(src, 'Chamado enviado à polícia.')
end)

local shotCooldown = {}
RegisterNetEvent('pe_police:shots', function(x, y, z)
    local src = source
    if (shotCooldown[src] or 0) > os.time() then return end
    shotCooldown[src] = os.time() + 30
    if type(x) == 'number' and type(y) == 'number' and type(z) == 'number' then
        alert('Disparos de arma de fogo reportados', x, y, z, '10-71')
    end
end)
