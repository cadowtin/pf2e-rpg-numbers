// import {generateDamageScroll, extractDamageInfoCombined, getTargetList} from './utility.js'
// HOOKS STUFF
Hooks.on("ready", async () => {
    console.error("PF2e RPG Numbers is ready");
    ui.notifications.notify("PF2e RPG Numbers is ready")
    //game.RPGNumbers = new RPGNumbers();
})

Hooks.on("createChatMessage", async function (msg, status, id) {
    //console.log({ msg })
    if (!msg.isDamageRoll || !game.user.isGM) return;
    const dmg_list = extractDamageInfoCombined(msg.rolls);
    const targets = getTargetList(msg);
    //console.log({ targets, dmg_list })
    generateDamageScroll(dmg_list, targets);
})

export function getTargetList(msg) {
    if (msg.flags?.["pf2e-target-damage"]?.targets) {
        return msg.flags['pf2e-target-damage'].targets.map(t => t.id);
    } else { // No pf2e target damage module
        return [msg?.target?.token?.id ?? msg.token.id];
    }
}

//TODO settings on visuals (colors)
//TODO settings on size etc.
//TODO add scaling based on % health
//TODO add scaling based on size
/**
 * Generates damage scrolling text for a passed in list of damage values
 * @param {{type: string, value: string}[]} dmg_list list of type and value
 * @param {string[]} targets list of token ids 
 */
export function generateDamageScroll(dmg_list, targets) {
    for (const target_id of targets) {
        const tok = game.canvas.tokens.get(target_id);
        const size = tok.document.texture.scaleY * tok.document.width;
        const topOffset = size * (game.settings.get("pf2e-rpg-numbers", 'top-offset') / 100);
        const fontSize = game.settings.get("pf2e-rpg-numbers", 'font-size');
        const jitter = game.settings.get("pf2e-rpg-numbers", 'jitter');
        const colors = {
            acid: "0x56fc03",
            bludgeoning: "0xc7c7c7",
            cold: "0x0394fc",
            fire: "0xfc5603",
            force: "0xff006a",
            lightning: "0x0313fc",
            "": "0xffffff",
            piercing: "0xc7c7c7",
            poison: "0x0b6625",
            mental: "0x710996",
            radiant: "0xffff54",
            slashing: "0xc7c7c7",
            electricity: "0x54ffb2",
            healing: "0x09ff00",
            negative: "0x4e4e68",
            positive: "0xffffbf",
            chaotic: "0xa600a6",
            evil: "0x611f90",
            good: "0x9d730a",
            lawful: "0x683e00",
            sonic: "darkcyan",
            bleed: "0x99001a",
        };
        const style = {
            "fill": "white",
            "fontSize": fontSize,
            align: "center",
            dropShadow: true,
            strokeThickness: 5,
        }

        const dmg_list_filtered = dmg_list.filter(d => d.value > 0);
        const seq = new Sequence();
        for (const dmg of dmg_list_filtered) {
            style.fontSize = fontSize * getFontScale("percentMaxHealth", dmg.value, tok);
            style.fill = colors[dmg.type] ?? 'white';
            seq.scrollingText()
                .atLocation(tok, { offset: { y: topOffset }, gridUnits: true })
                .text(`${dmg.value}`, style)
                .jitter(jitter)
                .anchor("TOP")
                .waitUntilFinished(-1800)
        }
        seq.play();
    }
}

/**
 * Extracts the list of damage info from pf2e chat message, only breaks it up between the overarching damage types
 * @param {any} rolls Roll value from pf2e chat message
 * @returns 
 */
export function extractDamageInfoCombined(rolls) {
    const result = [];

    for (const inp of rolls) {
        for (const term of inp.terms) {
            for (const roll of term.rolls) {
                const dmg = { type: roll.type, value: roll.total };
                result.push(dmg);
            }
        }
    }
    return result;
}

export function getFontScale(scaleType, dmg, tok) {
    const maxFontScale = game.settings.get("pf2e-rpg-numbers", 'max-font-scale');
    let scale = maxFontScale - 1;
    if (scaleType === "percentMaxHealth") {
        scale *= (dmg / (tok.actor.system.attributes.hp.max + tok.actor.system.attributes.hp.temp));
    }
    if (scaleType === "percentRemainingHealth") {
        scale *= (dmg / (tok.actor.system.attributes.hp.value + tok.actor.system.attributes.hp.temp));
    }
    if (scaleType === "none") {
        return 1;
    }
    return Math.max(1, Math.min(scale + 1, maxFontScale))
}