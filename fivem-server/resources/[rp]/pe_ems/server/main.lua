local function isMedic(src, duty) return PE.IsJob(src, 'ems', duty) end

local function nearHospital(src, key)
    for _, h in ipairs(Config.Hospitals) do
        if PE.Near(src, h[key], 10.0) then return true end
    end
    return false
end

local function alertMedics(src, text)
    local c = GetEntityCoords(GetPlayerPed(src))
    local meds = PE.JobPlayers('ems', true)
    for _, m in ipairs(meds) do
        TriggerClientEvent('pe_ems:client:alert', m, { msg = text, x = c.x, y = c.y, z = c.z })
    end
    return #meds
end

RegisterNetEvent('pe_ems:duty', function()
    local src = source
    if not isMedic(src, false) or not nearHospital(src, 'locker') then return end
    local on = not PE.Job(src).duty
    exports.pe_core:SetDuty(src, on)
    PE.Notify(src, on and 'Você entrou em serviço.' or 'Você saiu de serviço.')
end)

RegisterNetEvent('pe_ems:supply', function(item)
    local src = source
    if not isMedic(src, true) or not nearHospital(src, 'locker') then return end
    for _, e in ipairs(Config.Armory) do
        if e.item == item then
            if PE.ItemCount(src, item) >= e.max then return PE.Notify(src, 'Você já tem o máximo.') end
            PE.AddItem(src, item, 1)
            return PE.Notify(src, 'Item retirado.')
        end
    end
end)

RegisterNetEvent('pe_ems:alert', function()
    local src = source
    if not Player(src).state.dead then return end
    local n = alertMedics(src, 'Pessoa caída precisa de socorro')
    PE.Notify(src, n > 0 and ('%d paramédico(s) foram avisados.'):format(n) or 'Nenhum paramédico em serviço. Aguarde ou vá ao hospital.')
end)

RegisterCommand('192', function(src, args)
    if src == 0 then return end
    alertMedics(src, 'Chamado de ' .. GetPlayerName(src) .. ': ' .. (#args > 0 and table.concat(args, ' ') or 'preciso de um médico'))
    PE.Notify(src, 'Chamado enviado aos paramédicos.')
end)

RegisterNetEvent('pe_ems:revive', function(target)
    local src, tgt = source, tonumber(target)
    if not isMedic(src, true) or not tgt or not PE.Player(tgt) or not PE.NearPlayer(src, tgt, 5.0) then return end
    if not Player(tgt).state.dead then return end
    TriggerClientEvent('pe_ems:client:revive', tgt)
    PE.Notify(src, 'Paciente reanimado.')
end)

RegisterNetEvent('pe_ems:treat', function(target)
    local src, tgt = source, tonumber(target)
    if not isMedic(src, true) or not tgt or not PE.Player(tgt) or not PE.NearPlayer(src, tgt, 5.0) then return end
    TriggerClientEvent('pe_ems:client:treat', tgt)
    PE.Notify(src, 'Paciente tratado.')
end)

RegisterNetEvent('pe_ems:respawn', function()
    local src = source
    if not Player(src).state.dead then return end
    PE.Pay(src, Config.RespawnFee) -- se não tiver dinheiro, o atendimento sai de graça
    PE.SetMeta(src, 'hunger', 60)
    PE.SetMeta(src, 'thirst', 60)
end)

RegisterNetEvent('pe_ems:heal', function()
    local src = source
    if not nearHospital(src, 'reception') then return end
    if PE.Pay(src, Config.HealFee) then
        TriggerClientEvent('pe_ems:client:healed', src)
        PE.Notify(src, ('Atendimento concluído. -$%d'):format(Config.HealFee))
    else
        PE.Notify(src, 'Dinheiro insuficiente para o atendimento.')
    end
end)
