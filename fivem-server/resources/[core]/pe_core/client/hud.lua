CreateThread(function()
    while true do
        Wait(0)
        HideHudComponentThisFrame(3)
        HideHudComponentThisFrame(4)
        local d = PE.Data
        if d then
            local j = d.job
            local def = Config.Jobs[j.name]
            local jobText = def and def.label or j.name
            if def and def.grades[j.grade] and j.name ~= 'desempregado' then
                jobText = jobText .. ' - ' .. def.grades[j.grade].label
                if def.duty then jobText = jobText .. (j.duty and ' (em serviço)' or ' (fora de serviço)') end
            end
            PE.Text(0.985, 0.040, ('$ %d'):format(d.cash), 0.55, { 120, 230, 140, 255 }, { right = true })
            PE.Text(0.985, 0.075, ('Banco  $ %d'):format(d.bank), 0.38, { 200, 200, 200, 255 }, { right = true })
            PE.Text(0.985, 0.100, jobText, 0.36, { 255, 215, 120, 255 }, { right = true })
            -- fome (laranja) e sede (azul)
            local hunger, thirst = (d.meta.hunger or 100) / 100, (d.meta.thirst or 100) / 100
            DrawRect(0.94, 0.135, 0.09, 0.008, 0, 0, 0, 150)
            DrawRect(0.895 + 0.045 * hunger, 0.135, 0.09 * hunger, 0.008, 255, 160, 40, 220)
            DrawRect(0.94, 0.148, 0.09, 0.008, 0, 0, 0, 150)
            DrawRect(0.895 + 0.045 * thirst, 0.148, 0.09 * thirst, 0.008, 70, 160, 255, 220)
        end
    end
end)
