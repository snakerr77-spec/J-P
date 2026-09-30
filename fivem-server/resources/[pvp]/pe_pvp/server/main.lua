local stats = {}
do
    local raw = GetResourceKvpString('pvp:stats')
    stats = raw and json.decode(raw) or {}
end
local arena, streak = {}, {}

local function save() SetResourceKvp('pvp:stats', json.encode(stats)) end
CreateThread(function() while true do Wait(60000); save() end end)
AddEventHandler('onResourceStop', function(r) if r == GetCurrentResourceName() then save() end end)

local function entry(src)
    local id = PE.Identifier(src)
    if not id then return nil end
    stats[id] = stats[id] or { name = GetPlayerName(src), kills = 0, deaths = 0, best = 0 }
    stats[id].name = GetPlayerName(src)
    return stats[id]
end

RegisterNetEvent('pe_pvp:join', function()
    local src = source
    if not PE.Near(src, Config.Entry, 12.0) then return end
    if Player(src).state.cuffed or Player(src).state.dead then return end
    if (PE.Meta(src, 'jail') or 0) > 0 then return PE.Notify(src, 'Você está preso.') end
    arena[src], streak[src] = true, 0
    Player(src).state:set('arena', true, true)
end)

RegisterNetEvent('pe_pvp:leave', function()
    local src = source
    arena[src], streak[src] = nil, nil
    Player(src).state:set('arena', false, true)
end)

RegisterNetEvent('pe_pvp:died', function(killer)
    local src, k = source, tonumber(killer)
    if not arena[src] then return end
    local v = entry(src)
    if v then v.deaths = v.deaths + 1 end
    streak[src] = 0
    if k and k ~= src and arena[k] then
        local e = entry(k)
        streak[k] = (streak[k] or 0) + 1
        if e then
            e.kills = e.kills + 1
            e.best = math.max(e.best, streak[k])
        end
        local bonus = math.min(10, math.max(0, streak[k] - 2)) * Config.StreakBonus
        local reward = Config.KillReward + bonus
        PE.AddMoney(k, 'cash', reward)
        PE.Notify(k, ('Você eliminou %s! +$%d (sequência: %d)'):format(GetPlayerName(src), reward, streak[k]))
        for id in pairs(arena) do
            TriggerClientEvent('pe:notify', id, ('~r~%s~s~ eliminou ~b~%s~s~'):format(GetPlayerName(k), GetPlayerName(src)))
        end
    end
end)

AddEventHandler('playerDropped', function()
    local src = source
    arena[src], streak[src] = nil, nil
end)

PE.Callback('pe_pvp:ranking', function()
    local list = {}
    for _, s in pairs(stats) do list[#list + 1] = { name = s.name, kills = s.kills, deaths = s.deaths, best = s.best } end
    table.sort(list, function(a, b) return a.kills > b.kills end)
    local top = {}
    for i = 1, math.min(10, #list) do top[i] = list[i] end
    return top
end)
