local function openShop(kind)
    local stock = Config.Stock[kind]
    local items = {}
    for _, e in ipairs(stock.items) do
        items[#items + 1] = { label = PE.ItemLabel(e.item), right = '$' .. e.price,
            desc = e.license and 'Exige porte de arma' or nil }
    end
    PE.Menu(stock.label, items, function(i)
        TriggerServerEvent('pe_shops:buy', kind, i)
        SetTimeout(700, function() openShop(kind) end)
    end)
end

for _, s in ipairs(Config.Shops) do
    local stock = Config.Stock[s.type]
    PE.Blip(s.coords, stock.blip[1], stock.blip[2], stock.label, 0.7)
    PE.Zone({ coords = s.coords, label = 'Abrir ' .. stock.label, radius = 1.6, action = function() openShop(s.type) end,
        color = s.type == 'armas' and { 231, 76, 60 } or { 46, 204, 113 } })
end
