-- os nomes/rótulos dos itens vêm do pe_core (Config.Items); aqui só o preço
RegisterNetEvent('pe_shops:buy', function(kind, idx)
    local src = source
    local stock = Config.Stock[kind]
    local entry = stock and stock.items[tonumber(idx) or 0]
    if not entry then return end
    local near = false
    for _, s in ipairs(Config.Shops) do
        if s.type == kind and PE.Near(src, s.coords, 8.0) then near = true break end
    end
    if not near then return end
    if entry.license and not PE.Meta(src, 'license_arma') then
        return PE.Notify(src, 'Você precisa de porte de arma (peça a um policial).')
    end
    if not PE.Pay(src, entry.price) then return PE.Notify(src, 'Dinheiro insuficiente.') end
    PE.AddItem(src, entry.item, 1)
    PE.Notify(src, ('Comprado por $%d.'):format(entry.price))
end)
