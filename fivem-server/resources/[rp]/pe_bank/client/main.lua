local function openBank()
    local d = PE.Data
    if not d then return end
    PE.Menu('Banco Esmeralda', {
        { label = 'Saldo', desc = ('Em mãos: $%d  |  No banco: $%d'):format(d.cash, d.bank) },
        { label = 'Depositar', desc = 'Guardar dinheiro em mãos' },
        { label = 'Sacar', desc = 'Retirar dinheiro do banco' },
        { label = 'Transferir', desc = 'Enviar para outro cidadão (ID)' },
    }, function(i)
        if i == 1 then
            openBank()
        elseif i == 2 then
            PE.Input('Valor do depósito', '0', function(v) TriggerServerEvent('pe_bank:deposit', tonumber(v)) end)
        elseif i == 3 then
            PE.Input('Valor do saque', '0', function(v) TriggerServerEvent('pe_bank:withdraw', tonumber(v)) end)
        else
            PE.Input('ID do destinatário', '', function(id)
                PE.Input('Valor da transferência', '0', function(v)
                    TriggerServerEvent('pe_bank:transfer', tonumber(id), tonumber(v))
                end)
            end)
        end
    end)
end

for _, c in ipairs(Config.Banks) do
    PE.Blip(c, 108, 2, 'Banco', 0.75)
    PE.Zone({ coords = c, label = 'Acessar o banco', radius = 1.6, action = openBank })
end

-- caixas eletrônicos (props do mapa)
CreateThread(function()
    while true do
        local sleep = 700
        if not PE.busy then
            local pc = GetEntityCoords(PlayerPedId())
            for _, m in ipairs(Config.AtmModels) do
                if GetClosestObjectOfType(pc.x, pc.y, pc.z, 1.5, m, false, false, false) ~= 0 then
                    sleep = 0
                    PE.Help('~INPUT_CONTEXT~ Usar caixa eletrônico')
                    if IsControlJustReleased(0, 38) then openBank() end
                    break
                end
            end
        end
        Wait(sleep)
    end
end)

-- cobranças recebidas
RegisterNetEvent('pe_bank:client:charge', function(amount, reason, who)
    PE.Notify(('%s quer cobrar $%d (%s). Abra o menu para responder.'):format(who, amount, reason))
    PE.Menu(('Cobrança: $%d'):format(amount), {
        { label = 'Aceitar e pagar', desc = reason }, { label = 'Recusar' },
    }, function(i) TriggerServerEvent('pe_bank:answer', i == 1) end)
end)

-- /cobrar (menu do trabalho também usa este evento)
RegisterCommand('cobrar', function(_, args)
    local tgt = PE.ClosestPlayer(4.0)
    local amount = tonumber(args[1])
    if not tgt or not amount then return PE.Notify('Use: /cobrar [valor] [motivo] perto do cliente.') end
    table.remove(args, 1)
    TriggerServerEvent('pe_bank:chargeRequest', tgt, amount, #args > 0 and table.concat(args, ' ') or 'Serviço')
end, false)
