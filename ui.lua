RegisterNetEvent('kjmysql:openUi', function(data)
    SendNUIMessage({
        action = 'openUI',
        data = data
    })
    SetNuiFocus(true, true)
end)

RegisterNUICallback('exit', function(_, cb)
    cb(true)
    SetNuiFocus(false, false)
    TriggerServerEvent('kjmysql:uiClosed')
end)

RegisterNUICallback('fetchResource', function(data, cb)
    TriggerServerEvent('kjmysql:fetchResource', data)
    cb(true)
end)

RegisterNetEvent('kjmysql:loadResource', function(data)
    SendNUIMessage({
        action = 'loadResource',
        data = data
    })
end)