//========================================================================================================================
//                                                      VARIABLES
//------------------------------------------------------------------------------------------------------------------------
//                            MAKES SURE YOU KNOW WHAT YOU'RE DOING BEFORE YOU CHANGE ANYTHING 
//========================================================================================================================

/**
 * nothing really can be changed here, just cached variables
 * you actually don't have to change anything in this file at all
 * you can tweak everything from the 'sh_config.js' file!!
 */
const Cached = {
    _isAlive: true,
    _justDied: true,
    _reviveAt: 0,
    _respawnAt: 0,
    _reviveMessageTimer: 0,
    _respawnMessageTimer: 0,
    _isReviveAllowed: false,
    _isRespawnAllowed: false,
    _goingToClouds: false,
    _warningInterval: null,
    _warningCounter: 0,
    _warningCounterLimit: 0
}

const colors = [
    [
        '~c~',
        '~r~'
    ],
    [
        '~y~',
        '~y~'
    ]
];

const colGray = colors[0][0];
let colRed = colors[0][1];

//========================================================================================================================
//                                                     COMMANDS STUFF
//------------------------------------------------------------------------------------------------------------------------
//                            MAKES SURE YOU KNOW WHAT YOU'RE DOING BEFORE YOU CHANGE ANYTHING 
//========================================================================================================================

if (Config.Commands.Revive.Enabled) emit('chat:addSuggestion', Config.Commands.Revive.Suggestion.name, Config.Commands.Revive.Suggestion.help, []);
if (Config.Commands.Respawn.Enabled) emit('chat:addSuggestion', Config.Commands.Respawn.Suggestion.name, Config.Commands.Respawn.Suggestion.help, []);
if (Config.Commands.AdRev.Enabled) emit('chat:addSuggestion', Config.Commands.AdRev.Suggestion.name, Config.Commands.AdRev.Suggestion.help, Config.Commands.AdRev.Suggestion.Params);
if (Config.Commands.AdRes.Enabled) emit('chat:addSuggestion', Config.Commands.AdRes.Suggestion.name, Config.Commands.AdRes.Suggestion.help, Config.Commands.AdRes.Suggestion.Params);
if (Config.Commands.AdRevAll.Enabled) emit('chat:addSuggestion', Config.Commands.AdRevAll.Suggestion.name, Config.Commands.AdRevAll.Suggestion.help, []);
if (Config.Commands.AdResAll.Enabled) emit('chat:addSuggestion', Config.Commands.AdResAll.Suggestion.name, Config.Commands.AdResAll.Suggestion.help, []);
if (Config.Commands.ToggleDS.Enabled) emit('chat:addSuggestion', Config.Commands.ToggleDS.Suggestion.name, Config.Commands.ToggleDS.Suggestion.help, []);

RegisterKeyMapping('revive', 'Revive', 'keyboard', '')
RegisterKeyMapping('respawn', 'Respawn', 'keyboard', '')

if (Config.Commands.Revive.Enabled) {
    RegisterCommand('revive', () => {
        if (GetEntityHealth(PlayerPedId()) <= 2) {
            if (Cached._isReviveAllowed) {
                RevivePed(PlayerPedId());
                return emit('chat:addMessage', { args: Config.Commands.Revive.Messages.Revive });
            } else {
                return DisplayWarning();
            }
        } else {
            return emit('chat:addMessage', { args: Config.Commands.Revive.Messages.Alive });
        }
    });
}

if (Config.Commands.Respawn.Enabled) {
    RegisterCommand('respawn', () => {
        if (GetEntityHealth(PlayerPedId()) <= 2) {
            if (Cached._isRespawnAllowed) {
                RespawnPed(PlayerPedId());
                emit('chat:addMessage', { args: Config.Commands.Respawn.Messages.Respawn });
                return;
            } else {
                return DisplayWarning();
            }
        } else {
            return emit('chat:addMessage', { args: Config.Commands.Respawn.Messages.Alive });
        }
    });
}

//========================================================================================================================
//                                                         EVENTS
//------------------------------------------------------------------------------------------------------------------------
//                            MAKES SURE YOU KNOW WHAT YOU'RE DOING BEFORE YOU CHANGE ANYTHING 
//========================================================================================================================

/**
 * spawning the player then disabling 'AutoSpawn' 
 * otherwise the player will be stuck in the 'awaiting resources' screen forever
 * you'd also need to delay the 'AutoSpawn' so it triggers a few seconds after the player's ped spawns are ready to play  
 */
on('onClientMapStart', async () => {
    exports.spawnmanager.spawnPlayer()
    await Delay(3000)
    exports.spawnmanager.setAutoSpawn(false);
})

/**
 * this event is used by both 'Adrev' & 'Adrevall' commands
 * as there is no need for a new event for it
 * just pass a parameter and check if it's true or false
 */
onNet('DeathScript:Admin:Revive', (Moderator, Everyone = false) => {
    if (Everyone) {
        if (GetEntityHealth(PlayerPedId()) <= 2) {
            RevivePed(PlayerPedId());
            if (Moderator !== GetPlayerServerId(GetPlayerIndex())) emit('chat:addMessage', { args: Config.Commands.AdRevAll.Messages.ToPlayer.Revived });
            return;
        }
    } else {
        RevivePed(PlayerPedId());
    }
});

/**
 * this event is used by both 'Adres' & 'Adresall' commands
 * as there is no need for a new event for it
 * just pass a parameter and check if it's true or false
 * same shizz
 */
onNet('DeathScript:Admin:Respawn', (Moderator, Everyone = false) => {
    if (Everyone) {
        if (GetEntityHealth(PlayerPedId()) <= 2) {
            RespawnPed(PlayerPedId());
            if (Moderator !== GetPlayerServerId(GetPlayerIndex())) emit('chat:addMessage', { args: Config.Commands.AdResAll.Messages.ToPlayer.Respawned });
            return;
        }
    } else {
        RespawnPed(PlayerPedId());
    }
});

//========================================================================================================================
//                                                         MAIN THREADS
//------------------------------------------------------------------------------------------------------------------------
//                            MAKES SURE YOU KNOW WHAT YOU'RE DOING BEFORE YOU CHANGE ANYTHING 
//========================================================================================================================

/**
 * this only manages timer when the player's ped dies or their health reach 1
 */
setTick(async () => {
    if (!Config.Enabled) return;

    const Ped = PlayerPedId();
    if (IsEntityDead(Ped) && GetEntityHealth(Ped) <= 1) {
        const CurrentTimestamp = Date.now();

        if (CurrentTimestamp >= Cached._reviveAt) {
            if (!Cached._isReviveAllowed) {
                Cached._isReviveAllowed = true;
            }
        } else if (CurrentTimestamp >= Cached._reviveMessageTimer) {
            Cached._reviveMessageTimer = Date.now();
            if (Cached._isReviveAllowed) {
                Cached._isReviveAllowed = false;
            }
        }

        if (CurrentTimestamp >= Cached._respawnAt) {
            if (!Cached._isRespawnAllowed) {
                Cached._isRespawnAllowed = true;
            }
        } else if (CurrentTimestamp >= Cached._respawnMessageTimer) {
            Cached._respawnMessageTimer = Date.now();
            if (Cached._isRespawnAllowed) {
                Cached._isRespawnAllowed = false;
            }
        }
    }
    await Delay(500)
});

/**
 * this manages both Cached variables and the timer display text when the player's ped dies or their health reach 1
 */
setTick(async () => {
    const Ped = PlayerPedId();
    if (IsEntityDead(Ped) && GetEntityHealth(Ped) <= 1) {
        if (!Config.Enabled) return RespawnPed(Ped)

        if (Cached._justDied) {
            Cached._justDied = false;
            Cached._isAlive = false;
            Cached._reviveAt = Date.now() + (Config.Commands.Revive.WaitTime * 1000);
            Cached._respawnAt = Date.now() + (Config.Commands.Respawn.WaitTime * 1000);
        }
        if (!Cached._goingToClouds) {
            SetPlayerInvincible(Ped, true);
            SetEntityHealth(Ped, 1);
            DrawTextOnScreen(`
                ${colGray}Revive: ${Cached._isReviveAllowed ? ' ~g~/Revive' : parseInt((Cached._reviveAt - Date.now()) / 1000) === 1 ? colRed + ' In ' + parseInt((Cached._reviveAt - Date.now()) / 1000) + ' second' : colRed + 'In ' + parseInt((Cached._reviveAt - Date.now()) / 1000) + ' seconds'}
                ${colGray}Respawn: ${Cached._isRespawnAllowed ? ' ~g~/Respawn' : parseInt((Cached._respawnAt - Date.now()) / 1000) === 1 ? colRed + ' In ' + parseInt((Cached._respawnAt - Date.now()) / 1000) + ' second' : colRed + ' In ' + parseInt((Cached._respawnAt - Date.now()) / 1000) + ' seconds'}
            `);
        }
    }
});

//========================================================================================================================
//                                                        FUNCTIONS
//------------------------------------------------------------------------------------------------------------------------
//                            MAKES SURE YOU KNOW WHAT YOU'RE DOING BEFORE YOU CHANGE ANYTHING 
//========================================================================================================================

/**
 * @name DisplayWarning 
 * @description This is responsible for the red/yellow text flash when the player tries to revive/respawn before the timers run out to get their attention
 * @returns returnless
 * @example DisplayWarning()
 */
const DisplayWarning = () => {
    if (Cached._warningInterval) return Cached._warningCounterLimit = Cached._warningCounterLimit + 2
    Cached._warningCounter = 0;
    Cached._warningCounterLimit = 9;
    Cached._warningInterval = setInterval(() => {
        Cached._warningCounter++;
        PlaySoundFrontend(...Config.Sounds.Warning);
        colRed = colors[0][1] === colRed ? colors[1][1] : colors[0][1];
        if (Cached._warningCounter > Cached._warningCounterLimit || Cached._isReviveAllowed && Cached._isRespawnAllowed) {
            clearInterval(Cached._warningInterval);

            Cached._warningInterval = null;
            colRed = colors[0][1];
        }
    }, 400);
};

/**
 * @name ResetVariables 
 * @description Resets the usable Cached variables to be ready for next use  
 * @returns returnless
 * @example ResetVariables(Ped)
 */
const ResetVariables = () => {
    Cached._isAlive = true;
    Cached._justDied = true;
    Cached._reviveAt = 0;
    Cached._respawnAt = 0;
    Cached._reviveMessageTimer = 0;
    Cached._respawnMessageTimer = 0;
    Cached._isReviveAllowed = false;
    Cached._isRespawnAllowed = false;
};

/**
 * @name RevivePed 
 * @description Revives/Ressurect the player's ped after the revive timer runs out using the '/revive' command or the keybind
 * @param {*} Ped The players' ped
 * @returns returnless
 * @example RevivePed(Ped)
 */
const RevivePed = Ped => {
    const PedCoords = GetEntityCoords(Ped, true);
    const heading = GetEntityHeading(Ped);

    NetworkResurrectLocalPlayer(...PedCoords, heading, true, false);
    SetPlayerInvincible(Ped, false);
    ClearPedBloodDamage(Ped);
    ResetVariables();
};

/**
 * @name RespawnPed 
 * @description Respawns the player's ped after the respawn timer runs out using the '/respawn' command or the keybind
 * @param {*} Ped The players' ped
 * @returns returnless
 * @example RespawnPed(Ped)
 */
const RespawnPed = async Ped => {
    const [X, Y, Z, Heading] = GetNearestHospital(Ped);
    let tick;

    if (Config.GoToClouds) { // You can disable the clouds transition for a quick and instant respawn from the 'sh_config.js' file.
        Cached._goingToClouds = true // this is only a Cached variable; and doesn't stop the transition, if you want to remove the transition do so from the 'sh_config.js' file. 
        if (!IsPlayerSwitchInProgress()) {
            SwitchOutPlayer(PlayerPedId(), 0, 1); // Make player meet god
        }

        tick = setTick(() => {
            SetCloudHatOpacity(0.1);
            HideHudAndRadarThisFrame();
        });

        while (GetPlayerSwitchState() !== 5) { // Wait until player cam is in the sky
            await Delay(1);
        }
    }

    RequestCollisionAtCoord(X, Y, Z);
    FreezeEntityPosition(Ped, true);
    SetEntityCoordsNoOffset(Ped, X, Y, Z, false, false, false, true);
    NetworkResurrectLocalPlayer(X, Y, Z, Heading, true, false);
    SetPlayerInvincible(Ped, false);
    ClearPedBloodDamage(Ped);
    ResetVariables();

    if (Config.GoToClouds) { // You can disable the clouds transition for a quick and instant respawn from the 'sh_config.js' file.
        SwitchInPlayer(PlayerPedId()); // Get the player back to us
        while (GetPlayerSwitchState() !== 12) { // Wait until player cam is back to the ground
            await Delay(1);
        }
        clearTick(tick);
        Cached._goingToClouds = false // this is only a Cached variable; and doesn't stop the transition, if you want to remove the transition do so from the 'sh_config.js' file. 
    }

    FreezeEntityPosition(PlayerPedId(), false);
    TriggerEvent('playerSpawned', X, Y, Z, Heading); // Triggers the 'playerSpawned' event in 'spawnmanager' resource for better compatibility with other resources that utilize this event
};

/**
 * @name GetNearestHospital 
 * @description Gets the nearest registered hospital to the ped, registered hospitals can be editted from the 'sh_config.js' file.  
 * @param {*} Ped The players' ped
 * @returns {object} [Distance, X, Y, Z, Heading]
 * @example GetNearestHospital(Ped)
 */
const GetNearestHospital = Ped => {
    const Hospitals = Config.Hospitals;
    Hospitals.map((X, Y, Z, Heading) => ({ Distance: Vdist(...GetEntityCoords(Ped), X, Y, Z), X: X, Y: Y, Z: Z, Heading: Heading }))
    const ClosestHospital = Hospitals.reduce((a, b) => a.Distance < b.Distance ? a : b);
    return ClosestHospital;
};

/**
 * @name DrawTextOnScreen 
 * @description Draw a specified text on the screen
 * @param {string} Text The 'specified text' :p
 * @returns returnless
 * @example DrawTextOnScreen(Text)
 */
const DrawTextOnScreen = Text => {
    SetTextFont(4);
    SetTextScale(0.4, 0.4);
    SetTextOutline();
    SetTextEntry('STRING');
    AddTextComponentString(Text);
    DrawText(0.00, 0.465);
};

/**
 * @name Delay 
 * @description A shortcut funtion for an awaited promise use to delay intervals/ticks; a JS alternative to the 'Citizen.Wait' native in LUA/C#
 * @param {interger} MS The amount in milliseconds
 * @returns returnless
 * @example Delay(MS)
 */
const Delay = MS => {
    return new Promise(resolve => setTimeout(resolve, MS));
};

//========================================================================================================================
//                                                        EXPORTS
//------------------------------------------------------------------------------------------------------------------------
//                            MAKES SURE YOU KNOW WHAT YOU'RE DOING BEFORE YOU CHANGE ANYTHING 
//========================================================================================================================

exports('Revive', () => RevivePed(PlayerPedId()))
exports('Respawn', () => RespawnPed(PlayerPedId()))
