CreateThread(function()
    TriggerServerEvent('jp_base:requestWelcome')
end)

RegisterNetEvent('jp_base:welcome', function(msg)
    TriggerEvent('chat:addMessage', { args = { Config.ServerName, msg } })
end)
