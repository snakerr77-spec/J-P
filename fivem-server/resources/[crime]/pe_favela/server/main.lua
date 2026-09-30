local lastSale, lastChop = {}, {}
local heist = nil
local heistReady = 0

local function dirtyFirst(src, price)
    local dirty = PE.ItemCount(src, 'dinheiro_sujo')
    local useDirty = math.min(dirty, price)
    local rest = price - useDirty
    if rest > PE.Money(src, 'cash') then return false end
    if useDirty > 0 then PE.RemoveItem(src, 'dinheiro_sujo', useDirty) end
    if rest > 0 then PE.RemoveMoney(src, 'cash', rest) end
    return true
end

local function inFavela(src)
    return PE.Near(src, Config.Zone.center, Config.Zone.radius + 15.0)
end

local function alert(src, msg, code)
    local c = GetEntityCoords(GetPlayerPed(src))
    exports.pe_police:Alert(msg, c.x, c.y, c.z, code)
end

-- produção --------------------------------------------------------------------------------
RegisterNetEvent('pe_favela:harvest', function(idx)
    local src = source
    local f = Config.Fields[tonumber(idx) or 0]
    if not f or not PE.Near(src, f.coords, 12.0) or PE.IsJob(src, 'policia', true) then return end
    PE.AddItem(src, f.item, math.random(f.min, f.max))
end)

RegisterNetEvent('pe_favela:craft', function(id)
    local src = source
    if not PE.Near(src, Config.Lab, 10.0) then return end
    for _, r in ipairs(Config.Recipes) do
        if r.id == id then
            if PE.ItemCount(src, r.from) < r.need then return PE.Notify(src, 'Faltam ingredientes.') end
            PE.RemoveItem(src, r.from, r.need)
            PE.AddItem(src, r.to, r.give)
            return PE.Notify(src, ('Produzido: %dx %s'):format(r.give, PE.ItemDef(r.to).label))
        end
    end
end)

-- vendas ----------------------------------------------------------------------------------------
RegisterNetEvent('pe_favela:sell', function(item)
    local src = source
    local s = Config.Sales[item]
    if not s or PE.ItemCount(src, item) < 1 or not inFavela(src) or PE.IsJob(src, 'policia', true) then return end
    if (lastSale[src] or 0) > GetGameTimer() then return end
    lastSale[src] = GetGameTimer() + 2500
    if math.random() > Config.SaleSuccess then
        PE.Notify(src, 'O comprador desconfiou e recusou.')
        if math.random() < Config.SaleAlertChance then alert(src, 'Denúncia de tráfico de drogas', '10-35') end
        return
    end
    local cops = math.min(5, #PE.JobPlayers('policia', true))
    local price = math.floor(math.random(s.min, s.max) * (1 + Config.CopBonus * cops))
    PE.RemoveItem(src, item, 1)
    PE.AddItem(src, 'dinheiro_sujo', price)
    PE.Notify(src, ('Venda realizada: +$%d sujos.'):format(price))
end)

-- mercado negro ---------------------------------------------------------------------------------------
RegisterNetEvent('pe_favela:buy', function(idx)
    local src = source
    local e = Config.BlackMarket.items[tonumber(idx) or 0]
    if not e or not PE.Near(src, Config.BlackMarket.coords, 8.0) or PE.IsJob(src, 'policia', true) then return end
    if not dirtyFirst(src, e.price) then return PE.Notify(src, 'Não tenho tempo pra pobre. Traga a grana.') end
    PE.AddItem(src, e.item, 1)
    PE.Notify(src, 'Fechado. Some daqui.')
end)

-- desmanche -------------------------------------------------------------------------------------------------
RegisterNetEvent('pe_favela:chop', function(class)
    local src = source
    if not PE.Near(src, Config.Chop.coords, 15.0) or PE.IsJob(src, 'policia', true) then return end
    if (lastChop[src] or 0) > os.time() then return PE.Notify(src, 'Espere um pouco antes do próximo carro.') end
    lastChop[src] = os.time() + Config.Chop.cooldown
    local pay = Config.Chop.pay[tonumber(class) or -1] or Config.Chop.defaultPay
    PE.AddItem(src, 'dinheiro_sujo', pay)
    PE.Notify(src, ('Carro desmontado: +$%d sujos.'):format(pay))
    if math.random() < Config.Chop.alertChance then alert(src, 'Veículo furtado sendo desmontado', '10-54') end
end)

-- lavagem ------------------------------------------------------------------------------------------------------
RegisterNetEvent('pe_favela:launder', function(v)
    local src = source
    local amount = math.floor(tonumber(v) or 0)
    if not PE.Near(src, Config.Launder.coords, 8.0) or amount <= 0 then return end
    amount = math.min(amount, Config.Launder.maxPerTrade)
    if PE.ItemCount(src, 'dinheiro_sujo') < amount then return PE.Notify(src, 'Você não tem tanto dinheiro sujo.') end
    PE.RemoveItem(src, 'dinheiro_sujo', amount)
    local clean = math.floor(amount * Config.Launder.rate)
    PE.AddMoney(src, 'cash', clean)
    PE.Notify(src, ('Lavagem concluída: $%d limpos (taxa de %d%%).'):format(clean, math.floor((1 - Config.Launder.rate) * 100)))
end)

-- carro-forte -----------------------------------------------------------------------------------------------------------
PE.Callback('pe_favela:heistStart', function(src)
    if not PE.Near(src, Config.Heist.starter, 8.0) then return false, 'Longe demais.' end
    if #PE.JobPlayers('policia', true) < Config.Heist.minCops then return false, 'Muito cedo: a cidade está sem polícia suficiente.' end
    if os.time() < heistReady or heist then return false, 'O esquema está frio. Volte mais tarde.' end
    if PE.ItemCount(src, Config.Heist.need) < 1 then return false, 'Você precisa de um explosivo.' end
    heistReady = os.time() + Config.Heist.cooldown
    heist = { owner = src, looted = false, planted = false, netId = nil, started = os.time() }
    return true, math.random(#Config.Heist.routes)
end)

RegisterNetEvent('pe_favela:heistSpawned', function(netId)
    local src = source
    if not heist or heist.owner ~= src then return end
    heist.netId = netId
    alert(src, 'Assalto a carro-forte em andamento! Acompanhe no mapa.', '10-90')
end)

RegisterNetEvent('pe_favela:heistPlant', function()
    local src = source
    if not heist or heist.planted or not heist.netId then return end
    local ent = NetworkGetEntityFromNetworkId(heist.netId)
    if not DoesEntityExist(ent) or #(GetEntityCoords(ent) - GetEntityCoords(GetPlayerPed(src))) > 15.0 then return end
    if not PE.RemoveItem(src, Config.Heist.need, 1) then return end
    heist.planted = true
    TriggerClientEvent('pe_favela:client:plantOk', src, heist.netId)
end)

RegisterNetEvent('pe_favela:heistLoot', function()
    local src = source
    if not heist or not heist.planted or heist.looted or not heist.netId then return end
    local ent = NetworkGetEntityFromNetworkId(heist.netId)
    if not DoesEntityExist(ent) or #(GetEntityCoords(ent) - GetEntityCoords(GetPlayerPed(src))) > 15.0 then return end
    heist.looted = true
    local amount = math.random(Config.Heist.loot[1], Config.Heist.loot[2])
    PE.AddItem(src, 'dinheiro_sujo', amount)
    PE.Notify(src, ('Você saqueou $%d em dinheiro sujo!'):format(amount))
    alert(src, 'Carro-forte saqueado', '10-90')
    heist = nil
end)

-- rastreio do carro-forte para a polícia
CreateThread(function()
    while true do
        Wait(8000)
        if heist then
            if os.time() - heist.started > 1200 then
                heist = nil
            elseif heist.netId then
                local ent = NetworkGetEntityFromNetworkId(heist.netId)
                if DoesEntityExist(ent) then
                    local c = GetEntityCoords(ent)
                    for _, cop in ipairs(PE.JobPlayers('policia', true)) do
                        TriggerClientEvent('pe_favela:client:ping', cop, c.x, c.y, c.z)
                    end
                end
            end
        end
    end
end)

AddEventHandler('playerDropped', function() lastSale[source] = nil; lastChop[source] = nil end)
