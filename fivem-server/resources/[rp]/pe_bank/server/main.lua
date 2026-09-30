local pending = {}
local function amt(v) return math.floor(tonumber(v) or 0) end

RegisterNetEvent('pe_bank:deposit', function(v)
    local src, a = source, amt(v)
    if a > 0 and PE.RemoveMoney(src, 'cash', a) then
        PE.AddMoney(src, 'bank', a)
        PE.Notify(src, ('Depósito de $%d realizado.'):format(a))
    else PE.Notify(src, 'Valor inválido ou dinheiro insuficiente.') end
end)

RegisterNetEvent('pe_bank:withdraw', function(v)
    local src, a = source, amt(v)
    if a > 0 and PE.RemoveMoney(src, 'bank', a) then
        PE.AddMoney(src, 'cash', a)
        PE.Notify(src, ('Saque de $%d realizado.'):format(a))
    else PE.Notify(src, 'Valor inválido ou saldo insuficiente.') end
end)

RegisterNetEvent('pe_bank:transfer', function(target, v)
    local src, a, tgt = source, amt(v), tonumber(target)
    if not tgt or tgt == src or not PE.Player(tgt) or a <= 0 then return PE.Notify(src, 'Dados inválidos.') end
    if PE.RemoveMoney(src, 'bank', a) then
        PE.AddMoney(tgt, 'bank', a)
        PE.Notify(src, ('Transferência de $%d enviada.'):format(a))
        PE.Notify(tgt, ('Você recebeu uma transferência de $%d.'):format(a))
    else PE.Notify(src, 'Saldo insuficiente.') end
end)

RegisterNetEvent('pe_bank:chargeRequest', function(target, v, reason)
    local src, a, tgt = source, amt(v), tonumber(target)
    local job = PE.Job(src)
    if not job or not Config.BillJobs[job.name] or not job.duty and job.name ~= 'taxista' then
        return PE.Notify(src, 'Você não pode emitir cobranças.')
    end
    if not tgt or not PE.Player(tgt) or a <= 0 or a > 100000 or not PE.NearPlayer(src, tgt, 6.0) then
        return PE.Notify(src, 'Cliente inválido, valor inválido ou muito longe.')
    end
    pending[tgt] = { from = src, amount = a, t = os.time() }
    TriggerClientEvent('pe_bank:client:charge', tgt, a, tostring(reason or 'Serviço'):sub(1, 60), GetPlayerName(src))
    PE.Notify(src, 'Cobrança enviada.')
end)

RegisterNetEvent('pe_bank:answer', function(accept)
    local tgt = source
    local p = pending[tgt]
    pending[tgt] = nil
    if not p or os.time() - p.t > 90 then return end
    if not accept then return PE.Notify(p.from, 'O cliente recusou a cobrança.') end
    if PE.Pay(tgt, p.amount) then
        PE.AddMoney(p.from, 'bank', p.amount)
        PE.Notify(tgt, ('Você pagou $%d.'):format(p.amount))
        PE.Notify(p.from, ('Você recebeu $%d no banco.'):format(p.amount))
    else
        PE.Notify(tgt, 'Dinheiro insuficiente.')
        PE.Notify(p.from, 'O cliente não tem saldo.')
    end
end)
