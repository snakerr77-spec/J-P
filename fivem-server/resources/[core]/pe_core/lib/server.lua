-- Biblioteca compartilhada (server). Incluída com: server_script '@pe_core/lib/server.lua'
PE = PE or {}

function PE.Notify(src, msg) TriggerClientEvent('pe:notify', src, msg) end
function PE.Player(src) return exports.pe_core:GetPlayer(src) end
function PE.Job(src) local d = exports.pe_core:GetPlayer(src); return d and d.job or nil end
function PE.IsJob(src, name, duty)
    local j = PE.Job(src)
    return j ~= nil and j.name == name and (not duty or j.duty == true)
end
function PE.Identifier(src) return exports.pe_core:GetIdentifier(src) end
function PE.AddMoney(src, acct, n) return exports.pe_core:AddMoney(src, acct, n) end
function PE.RemoveMoney(src, acct, n) return exports.pe_core:RemoveMoney(src, acct, n) end
function PE.Money(src, acct) return exports.pe_core:GetMoney(src, acct) end
function PE.Pay(src, n) return exports.pe_core:Pay(src, n) end
function PE.AddItem(src, item, n) return exports.pe_core:AddItem(src, item, n or 1) end
function PE.RemoveItem(src, item, n) return exports.pe_core:RemoveItem(src, item, n or 1) end
function PE.ItemCount(src, item) return exports.pe_core:ItemCount(src, item) end
function PE.Meta(src, key) return exports.pe_core:GetMeta(src, key) end
function PE.SetMeta(src, key, val) return exports.pe_core:SetMeta(src, key, val) end
function PE.JobPlayers(name, duty) return exports.pe_core:GetJobPlayers(name, duty) end

function PE.Near(src, c, dist)
    local p = GetEntityCoords(GetPlayerPed(src))
    return #(p - vec3(c.x, c.y, c.z)) <= dist
end
function PE.NearPlayer(a, b, dist)
    return #(GetEntityCoords(GetPlayerPed(a)) - GetEntityCoords(GetPlayerPed(b))) <= dist
end
function PE.NearAny(src, list, dist)
    for _, c in ipairs(list) do if PE.Near(src, c, dist) then return true end end
    return false
end

function PE.Callback(name, fn)
    RegisterNetEvent('pe:cb:' .. name)
    AddEventHandler('pe:cb:' .. name, function(id, res, ...)
        local src = source
        local r = table.pack(fn(src, ...))
        TriggerClientEvent(('pe:cbr:%s:%d'):format(res, id), src, table.unpack(r, 1, r.n))
    end)
end

function PE.ItemDef(name) return exports.pe_core:ItemDef(name) end
function PE.IsAdmin(src) return exports.pe_core:IsAdmin(src) end
