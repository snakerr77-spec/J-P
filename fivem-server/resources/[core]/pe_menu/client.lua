local current = nil

local function closeUi()
    current = nil
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
end

exports('Open', function(title, items, cb, onClose)
    current = { cb = cb, items = items, onClose = onClose }
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'open', title = title, items = items })
end)

exports('Input', function(title, placeholder, cb, onClose)
    current = { input = cb, onClose = onClose }
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'input', title = title, placeholder = placeholder or '' })
end)

exports('Close', closeUi)
exports('IsOpen', function() return current ~= nil end)

RegisterNUICallback('select', function(data, cb)
    local c, idx = current, tonumber(data.index)
    closeUi()
    if c and c.cb and idx then pcall(c.cb, idx, c.items[idx]) end
    cb('ok')
end)

RegisterNUICallback('submit', function(data, cb)
    local c = current
    closeUi()
    if c and c.input then pcall(c.input, tostring(data.value or '')) end
    cb('ok')
end)

RegisterNUICallback('close', function(_, cb)
    local c = current
    closeUi()
    if c and c.onClose then pcall(c.onClose) end
    cb('ok')
end)

AddEventHandler('onResourceStop', function(res)
    if res == GetCurrentResourceName() then SetNuiFocus(false, false) end
end)
