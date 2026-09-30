-- Permissão: add_ace group.admin pe.admin allow   (ver server.cfg.example)
local function admin(src) return src == 0 or PE.IsAdmin(src) end
local function reply(src, msg) if src == 0 then print(msg) else PE.Notify(src, msg) end end

local function cmd(name, fn)
    RegisterCommand(name, function(src, args)
        if not admin(src) then return end
        fn(src, args)
    end, false)
end

cmd('dinheiro', function(src, a)
    local t, acct, n = tonumber(a[1]), a[2] == 'banco' and 'bank' or 'cash', tonumber(a[3])
    if t and n and PE.AddMoney(t, acct, n) then reply(src, 'Dinheiro entregue.') else reply(src, 'Use: /dinheiro [id] [mao|banco] [valor]') end
end)

cmd('daritem', function(src, a)
    local t, item, n = tonumber(a[1]), a[2], tonumber(a[3]) or 1
    if t and item and PE.AddItem(t, item, n) then reply(src, 'Item entregue.') else reply(src, 'Use: /daritem [id] [item] [qtd]') end
end)

cmd('porte', function(src, a)
    local t = tonumber(a[1])
    if t and PE.Player(t) then PE.SetMeta(t, 'license_arma', true); reply(src, 'Porte concedido.') end
end)

cmd('anuncio', function(src, a)
    if #a > 0 then TriggerClientEvent('chat:addMessage', -1, { color = { 255, 200, 0 }, args = { 'ANÚNCIO', table.concat(a, ' ') } }) end
end)

cmd('kick', function(src, a)
    local t = tonumber(a[1])
    if t and GetPlayerName(t) then table.remove(a, 1); DropPlayer(t, #a > 0 and table.concat(a, ' ') or 'Removido por um administrador.') end
end)

cmd('ir', function(src, a)
    local t = tonumber(a[1])
    if src ~= 0 and t and GetPlayerName(t) then TriggerClientEvent('pe_admin:tp', src, GetEntityCoords(GetPlayerPed(t))) end
end)

cmd('trazer', function(src, a)
    local t = tonumber(a[1])
    if src ~= 0 and t and GetPlayerName(t) then TriggerClientEvent('pe_admin:tp', t, GetEntityCoords(GetPlayerPed(src))) end
end)

cmd('reviver', function(src, a)
    local t = tonumber(a[1]) or src
    if t ~= 0 then TriggerClientEvent('pe_ems:client:revive', t); TriggerClientEvent('pe_ems:client:healed', t) end
end)

-- o client só obedece eventos vindos do próprio server; verificação de admin aqui
RegisterNetEvent('pe_admin:request', function(kind)
    if not admin(source) then return end
    TriggerClientEvent('pe_admin:do', source, kind)
end)
