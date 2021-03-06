'use strict';

$(document).ready(function () {
    trainerTools.init();
});

var trainerTools = {
    teams: [
        {
            name: 'TeamLess',
            color: 'grey',
            colorVariant: 'darken-2'
        },
        {
            name: 'Mystic',
            color: 'blue',
            colorVariant: 'darken-3'
        },
        {
            name: 'Valor',
            color: 'red',
            colorVariant: 'darken-3'
        },
        {
            name: 'Instinct',
            color: 'yellow',
            colorVariant: 'darken-3'
        }
    ],
    trainerSex: [
        'm',
        'f'
    ],
    pathColors: [
        '#A93226',
        '#884EA0',
        '#2471A3',
        '#17A589',
        '#229954',
        '#D4AC0D',
        '#CA6F1E',
        '#CB4335',
        '#7D3C98',
        '#2E86C1',
        '#138D75',
        '#28B463',
        '#D68910',
        '#BA4A00'
    ],

    settings: {},
    pythonServer: {},

    pokemonsArray: {},
    candiesArray: {},
    itemsArray: {},
    movesArray: {},
    movesArrayIdsOrder: [],
    levelXpArray: {},

    trainerData: {},

    init: function () {
        // Load settings from settings.js
        this.settings = $.extend(true, this.settings, settings);

        // Load datagame files
        this.loadDatagameFiles();

        // Load trainers files
        this.loadTrainers();

        // Design view
        setTimeout(function () {
            trainerTools.initView();
        }, 1000);

        // Bind UI events
        this.bindUIEvents();
    },

    loadDatagameFiles: function () {
        var pokemonsJsonFile = 'gamedata/pokemons.json',
            candiesJsonFile = 'gamedata/candies.json',
            itemsJsonFile = 'gamedata/items.json',
            movesJsonFile = 'gamedata/moves.json',
            xpbylevelJsonFile = 'gamedata/xpbylevel.json';

        this.infoLog('Loading game data...');

        this.loadJSON(pokemonsJsonFile, function (data) {
            trainerTools.pokemonsArray = data;
            trainerTools.successLog(pokemonsJsonFile + ' loaded');
        }, null, this.errorLog, 'Failed to load \'' + pokemonsJsonFile + '\' file', true);

        this.loadJSON(candiesJsonFile, function (data) {
            trainerTools.candiesArray = data;
            trainerTools.successLog(candiesJsonFile + ' loaded');
        }, null, this.errorLog, 'Failed to load \'' + candiesJsonFile + '\' file', true);

        this.loadJSON(itemsJsonFile, function (data) {
            trainerTools.itemsArray = data;
            trainerTools.successLog(itemsJsonFile + ' loaded');
        }, null, this.errorLog, 'Failed to load \'' + itemsJsonFile + '\' file', true);

        this.loadJSON(movesJsonFile, function (data) {
            trainerTools.movesArray = data;
            for (var i = 0; i < trainerTools.movesArray.length; i++) {
                trainerTools.movesArrayIdsOrder[trainerTools.movesArray[i].id] = i;
            }
            trainerTools.successLog(movesJsonFile + ' loaded');
        }, null, this.errorLog, 'Failed to load \'' + movesJsonFile + '\' file', true);

        this.loadJSON(xpbylevelJsonFile, function (data) {
            trainerTools.levelXpArray = data;
            trainerTools.successLog(xpbylevelJsonFile + ' loaded');
        }, null, this.errorLog, 'Failed to load \'' + xpbylevelJsonFile + '\' file', true);
    },

    loadTrainers: function () {
        var trainersNameList = this.settings.trainers,
            trainerName,
            inventoryJson,
            playerJson,
            settingsJson,
            noSettingFound = 'No setting was found for trainer in web/config/settings.js';

        if (trainersNameList.length >= 1) {
            this.infoLog('Starting to load trainers data...');

            for (var i = 0; i < trainersNameList.length; i++) {
                trainerName = trainersNameList[i];

                inventoryJson = 'playerdata/inventory-' + trainerName + '.json';
                playerJson = 'playerdata/player-' + trainerName + '.json';
                settingsJson = 'playerdata/settings-' + trainerName + '.json';

                this.loadJSON(inventoryJson, this.setInventoryData, trainerName, this.errorLog);
                this.loadJSON(playerJson, this.setPlayerData, trainerName, this.errorLog);
                this.loadJSON(settingsJson, this.setSettingsData, trainerName, this.errorLog);
            }
        } else {
            this.errorLogAndConsole(noSettingFound, true);
            this.buildErrorContent(noSettingFound);
        }
    },

    initView: function () {
        // Build trainer list menu in navbar
        this.buildTrainersListMenu();
    },

    bindUIEvents: function () {
        // Launch a scan
        $('#scan-logo').click(function () {
            var logoButton = $('#scan-logo');

            logoButton.addClass('waiting');

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    var lat = position.coords.latitude,
                        lon = position.coords.longitude,
                        location = '';

                    if (typeof lat !== 'undefined' && typeof lon !== 'undefined') {
                        location = lat.toString() + ',' + lon.toString();
                        trainerTools.successLog('Geolocalisation data retrieved: ' + location);
                        trainerTools.doARemoteScan(location);
                    } else {
                        trainerTools.errorLog('Failed to retrieve geolocalisation data.', true);
                        logoButton.removeClass('waiting');
                    }
                });
            } else {
                trainerTools.errorLog('Failed to retrieve geolocalisation data.', true);
                logoButton.removeClass('waiting');
            }
        });

        // Open / close logs panels
        $('#logs-button').click(function () {
            $('#logs-panel').toggle();
        });

        // Close section menu on clic everywhere
        $('body').click(function (e) {
            var fab = $('#section-button');

            if (fab.hasClass('active')) {
                fab.closeFAB();
                e.stopPropagation();
            }
        });

        // Show selected content view
        $('.btn-section').click(function () {
            var choice = $(this).data('section-choice');

            trainerTools.showSelectedContentAndHideTheRest(choice);
        });

        // Close content card
        $('.close').click(function () {
            $("article.content").addClass('hide');
        });
    },

    buildTrainersListMenu: function () {
        var trainers = this.settings.trainers,
            navContainer = $('#nav-mobile'),
            dropDownMenu = navContainer.find('.dropdown-button'),
            aloneButton = navContainer.find('.alone-button'),
            trainersNameList = $('#trainers-list'),
            atLeastOneTrainer = false,
            noDataFoundMessage = 'No trainer data found in web/playerdata directory!<br/>' +
                'Please, check you have already fetch some data with python scan tool then reload this page',
            noDataFoundMessageShort = 'No trainer data found',
            html;

        if (trainers.length > 1) {
            trainersNameList.empty();
            for (var i = 0; i < trainers.length; i++) {
                if (typeof this.trainerData[trainers[i]] !== 'undefined') {
                    html = '<li>' +
                        '<a href="#" class="trainer black-text" data-trainer-id="' + i + '">' + trainers[i] + '</a>' +
                        '</li>';
                    trainersNameList.append(html);
                    atLeastOneTrainer = true;
                }
            }

            if (atLeastOneTrainer) {
                // Bind event when user select a trainer in list
                trainersNameList.on('click', '.trainer', function () {
                    // Get trainer name
                    var trainerId = $(this).data('trainer-id');
                    var trainerName = trainers[trainerId];

                    // Display trainer name in dropdown title
                    $('#nav-mobile').find('.dropdown-title').html(trainerName);

                    // Set team color and build contents
                    trainerTools.activateUserAndBuildContents(trainerName);
                });

                // Remove error content if exists
                this.buildErrorContent('');

                aloneButton.addClass('hide');
                dropDownMenu.removeClass('hide');
            } else {
                aloneButton.html(noDataFoundMessageShort);
                this.errorLog(noDataFoundMessageShort);
                this.buildErrorContent(noDataFoundMessage);
            }
        } else if (trainers.length === 1 && typeof this.trainerData[trainers[0]] !== 'undefined') {
            // Get trainer name
            var trainerName = trainers[0];

            // Display trainer name in navbar
            aloneButton.html(trainerName);

            // Remove error content if exists
            this.buildErrorContent('');

            // Set team color and build contents
            this.activateUserAndBuildContents(trainerName);
        } else {
            aloneButton.html(noDataFoundMessageShort);
            this.errorLog(noDataFoundMessageShort);
            this.buildErrorContent(noDataFoundMessage);
        }
    },

    buildErrorContent: function (errorMessage) {
        var container = $('article.content[data-section="welcome"]'),
            html = '<div class="row"><div class="col s12 red-text">' + errorMessage + '</div></div>';
        container.find('.subcontent').html(html);
    },

    activateUserAndBuildContents: function (trainerName) {
        this.successLog(trainerName + ' player loaded');
        this.successLog('Player data last updated: ' + this.timeConverterFullDate(this.trainerData[trainerName].lastUpdateTimestamp));

        // Show default content
        trainerTools.showSelectedContentAndHideTheRest('welcome');

        // Build content card
        this.buildAllContents(trainerName);

        // Apply team color
        this.applyTrainerTeamColor(trainerName);

        // Show section menu
        $('#section-button').removeClass('hide');
    },

    buildAllContents: function (trainerName) {
        // Build info card
        this.buildInfosContent(trainerName);

        // Build pokemon card
        this.buildPokemonContent(trainerName);

        // Build pokedex card
        this.buildPokedexContent(trainerName);

        // Build item card
        this.buildItemContent(trainerName);
    },

    buildInfosContent: function (trainerName) {
        var container = $('article.content[data-section="info"]'),
            currentTrainerStats = this.trainerData[trainerName].stats[0].inventory_item_data.player_stats,
            playerInfo = this.trainerData[trainerName].player,
            team = this.getTeam(trainerName),
            html;

        container.find('.subtitle').html('Trainer Infos');

        html = '<div class="info row">' +
            '<div class="col s12">' +
            '<ul class="collection with-header center">' +
            '<li class="collection-header"><h5 class="center">' + playerInfo.username + ' (' + currentTrainerStats.level + ')</h5></li>' +
            '<li class="collection-item">Start to play <b>' + this.timeConverterFullDate(playerInfo.creation_timestamp_ms) +
            (parseInt(currentTrainerStats.next_level_xp, 10) - currentTrainerStats.experience) + '</b></li>' +
            '<li class="collection-item">Exp total <b>' + currentTrainerStats.experience + '</b></li>' +
            '<li class="collection-item">Exp to next Lvl <b>' +
            (currentTrainerStats.experience - this.levelXpArray[currentTrainerStats.level - 1].current_level_xp) + ' / ' +
            this.levelXpArray[currentTrainerStats.level - 1].exp_to_next_level + '</b>' +
            '<div class="progress teambar-' + team + '" style="height: 10px">' +
            '<div class="determinate team-' + team + '" style="width: ' +
            (currentTrainerStats.experience / currentTrainerStats.next_level_xp) * 100 + '%"></div>' +
            '</div>' +
            '</li>' +
            '<li class="collection-item">Stardust <b>' + (parseFloat(playerInfo.currencies[1].amount) || 0) + '</b></li>' +
            '<li class="collection-item">Pokecoin <b>' + (parseFloat(playerInfo.currencies[0].amount) || 0) + '</b></li>' +
            '<li class="collection-item">Kilometers walked <b>' + (parseFloat(currentTrainerStats.km_walked).toFixed(3) || 0) + '</b></li>' +
            '<li class="collection-item">Pokemon encountered <b>' + (currentTrainerStats.pokemons_encountered || 0) + '</b></li>' +
            '<li class="collection-item">Pokeballs thrown <b>' + (currentTrainerStats.pokeballs_thrown || 0) + '</b></li>' +
            '<li class="collection-item">Pokemon caught <b>' + (currentTrainerStats.pokemons_captured || 0) + '</b></li>' +
            '<li class="collection-item">Pokemon evolved <b>' + (currentTrainerStats.evolutions || 0) + '</b></li>' +
            '<li class="collection-item">Eggs hatched <b>' + (currentTrainerStats.eggs_hatched || 0) + '</b></li>' +
            '<li class="collection-item">Unique pokedex entries <b>' + (currentTrainerStats.unique_pokedex_entries || 0) + '</b></li>' +
            '<li class="collection-item">PokeStops visited <b>' + (currentTrainerStats.poke_stop_visits || 0) + '</b></li>' +
            '<li class="collection-item">Gym attacks won/total <b>' + (currentTrainerStats.battle_attack_won || 0) + ' / ' +
            (currentTrainerStats.battle_attack_total || 0) + '</b></li>' +
            '<li class="collection-item">Gym training won/total <b>' + (currentTrainerStats.battle_training_won || 0) + ' / ' +
            (currentTrainerStats.battle_training_total || 0) + '</b></li>' +
            '<li class="collection-item">Prestige raised <b>' + (currentTrainerStats.prestige_raised_total || 0) + '</b></li>' +
            '<li class="collection-item">Prestige dropped <b>' + (currentTrainerStats.prestige_dropped_total || 0) + '</b></li>' +
            '<li class="collection-item">Big magikarp caught <b>' + (currentTrainerStats.big_magikarp_caught || 0) + '</b></li>' +
            '<li class="collection-item">Small rattata caught <b>' + (currentTrainerStats.small_rattata_caught || 0) + '</b></li>' +
            '</ul>' +
            '</div>' +
            '</div>';

        container.find('.subcontent').html(html);
    },

    buildPokemonContent: function (trainerName) {
        var container = $('article.content[data-section="pokemon"]'),
            pkmnTotal = this.trainerData[trainerName].bagPokemon.length;

        container.find('.subtitle').html(pkmnTotal + ' Pokemon');

        var sortButtons = '<div class="col s12 center">';
        sortButtons += '<div class="chip"><a class="sort pokemon white-text" href="#" data-sort="id">ID</a></div>';
        sortButtons += '<div class="chip"><a class="sort pokemon white-text" href="#" data-sort="iv">IV</a></div>';
        sortButtons += '<div class="chip"><a class="sort pokemon white-text" href="#" data-sort="cp">CP</a></div>';
        sortButtons += '<div class="chip"><a class="sort pokemon white-text" href="#" data-sort="time">Time</a></div>';
        sortButtons += '<div class="chip"><a class="sort pokemon white-text" href="#" data-sort="name">Name</a></div>';
        sortButtons += '<div class="chip"><a class="sort pokemon white-text"  href="#" data-sort="candy">Candy</a></div>';
        sortButtons += '</div>';
        container.find('.sort-buttons').html(sortButtons);

        var pokemonListSorted = this.sortAndShowBagPokemon('id', trainerName);
        container.find('.subcontent').html(pokemonListSorted);

        // Binding sorts button
        $('a.sort.pokemon').click(function () {
            var item = $(this),
                pokemonListSorted = trainerTools.sortAndShowBagPokemon(item.data('sort'), trainerName);
            container.find('.subcontent').html(pokemonListSorted);
        });
    },

    buildPokedexContent: function (trainerName) {
        var container = $('article.content[data-section="pokedex"]'),
            pkmnTotal = this.trainerData[trainerName].pokedex.length;

        container.find('.subtitle').html('Pokedex ' + pkmnTotal + ' / 151');

        var sortButtons = '<div class="col s12 center">';
        sortButtons += '<div class="chip"><a class="sort pokedex white-text" href="#" data-sort="id">ID</a></div>';
        sortButtons += '<div class="chip"><a class="sort pokedex white-text" href="#" data-sort="name">Name</></div>';
        sortButtons += '<div class="chip"><a class="sort pokedex white-text" href="#" data-sort="enc">Seen</a></div>';
        sortButtons += '<div class="chip"><a class="sort pokedex white-text" href="#" data-sort="cap">Caught</a></div>';
        sortButtons += '</div>';
        container.find('.sort-buttons').html(sortButtons);

        var pokemonListSorted = this.sortAndShowPokedex('id', trainerName);
        container.find('.subcontent').html(pokemonListSorted);

        // Binding sorts button
        $('a.sort.pokedex').click(function () {
            var item = $(this),
                pokemonListSorted = trainerTools.sortAndShowPokedex(item.data('sort'), trainerName);
            container.find('.subcontent').html(pokemonListSorted);
        });
    },

    buildItemContent: function (trainerName) {
        var container = $('article.content[data-section="item"]'),
            currentTrainerItems = this.trainerData[trainerName].bagItems,
            total = 0,
            html;

        html = '<div class="items"><div class="row">';

        for (var i = 0; i < currentTrainerItems.length; i++) {
            var nbItems = 0;

            if (currentTrainerItems[i].inventory_item_data.item.count > 0) {
                var itemData = currentTrainerItems[i].inventory_item_data.item;

                if (nbItems % 4 === 0) {
                    html += '<div class="row">';
                }

                html += '<div class="col s12 m6 l3 center poke-item">' +
                    '<div class="poke-title">' + this.itemsArray[itemData.item_id] + ' (' + (itemData.count || 0) + ')</div>' +
                    '<div class="col s12 poke-img">' +
                    '<img src="image/items/' + itemData.item_id + '.png" class="png_img">' +
                    '</div>' +
                    '</div>';

                if (nbItems % 4 === 3 || i === currentTrainerItems.length - 1) {
                    html += '</div>';
                }

                total = total + (itemData.count || 0);

                nbItems++;
            }
        }

        html += '</div></div>';

        container.find('.subtitle').html(total + " item" + (total !== 1 ? "s" : "") + " in Bag");
        container.find('.subcontent').html(html);
    },

    applyTrainerTeamColor: function (trainerName) {
        var teams = this.teams,
            trainerTeam = this.teams[this.getTeam(trainerName)];

        // Change color for nav bar
        var navContainer = $('#nav-wrapper');
        navContainer.removeClass('black');
        for (var i = 0; i < teams.length; i++) {
            navContainer.removeClass(teams[i].color);
            if (teams[i].colorVariant !== '') {
                navContainer.removeClass(teams[i].colorVariant);
            }
        }
        navContainer.addClass(trainerTeam.color);
        navContainer.addClass(trainerTeam.colorVariant);

        // Change color for logs button
        var logButton = $('#logs-button');
        logButton.removeClass('black');
        for (var i = 0; i < teams.length; i++) {
            logButton.removeClass(teams[i].color);
            if (teams[i].colorVariant !== '') {
                logButton.removeClass(teams[i].colorVariant);
            }
        }
        logButton.addClass(trainerTeam.color);
        logButton.addClass(trainerTeam.colorVariant);

        // Change color for section button elements
        var sectionButton = $('#section-button');
        sectionButton.find('.btn-floating').each(function () {
            for (var i = 0; i < teams.length; i++) {
                $(this).removeClass(teams[i].color);
                if (teams[i].colorVariant !== '') {
                    $(this).removeClass(teams[i].colorVariant);
                }
            }
            $(this).addClass(trainerTeam.color);
            $(this).addClass(trainerTeam.colorVariant);
        });

        // Change color for sort buttons
        var sectionButton = $('.sort-buttons');
        sectionButton.find('.chip').each(function () {
            for (var i = 0; i < teams.length; i++) {
                $(this).removeClass(teams[i].color);
                if (teams[i].colorVariant !== '') {
                    $(this).removeClass(teams[i].colorVariant);
                }
            }
            $(this).addClass(trainerTeam.color);
            $(this).addClass(trainerTeam.colorVariant);
        });
    },

    showSelectedContentAndHideTheRest: function (sectionTarget) {
        // Hides all contents
        $("article.content").addClass('hide');

        // Show target content
        $("article.content[data-section=" + sectionTarget + "]").removeClass('hide');
    },

    sortAndShowBagPokemon: function (sortOn, trainerName) {
        var trainer = this.trainerData[trainerName],
            eggs = 0,
            sortedPokemon = [],
            html;

        if (!trainer.bagPokemon.length) return;

        html = '<div class="items">';

        for (var i = 0; i < trainer.bagPokemon.length; i++) {
            if (trainer.bagPokemon[i].inventory_item_data.pokemon_data.is_egg) {
                eggs++;
                continue;
            }
            var pokemonData = trainer.bagPokemon[i].inventory_item_data.pokemon_data,
                pkmID = pokemonData.pokemon_id,
                pkmUID = pokemonData.id,
                pkmName = this.pokemonsArray[pkmID - 1].Name,
                pkmCP = pokemonData.cp,
                pkmMaxHP = pokemonData.stamina_max || 0,
                pkmCurrentHP = pokemonData.stamina || 0,
                pkmMove1 = pokemonData.move_1 || null,
                pkmMove2 = pokemonData.move_2 || null,
                pkmIVA = pokemonData.individual_attack || 0,
                pkmIVD = pokemonData.individual_defense || 0,
                pkmIVS = pokemonData.individual_stamina || 0,
                pkmIV = ((pkmIVA + pkmIVD + pkmIVS) / 45.0).toFixed(2),
                pkmCreationTime = pokemonData.creation_time_ms || 0;

            sortedPokemon.push({
                "id": pkmID,
                "unique_id": pkmUID,
                "name": pkmName,
                "cp": pkmCP,
                "maxHealth": pkmMaxHP,
                "currentHealth": pkmCurrentHP,
                "move1": pkmMove1,
                "move2": pkmMove2,
                "attack": pkmIVA,
                "defense": pkmIVD,
                "stamina": pkmIVS,
                "iv": pkmIV,
                "creationTime": pkmCreationTime,
                "candy": this.getCandy(pkmID, trainer)
            });
        }
        switch (sortOn) {
            case 'name':
                sortedPokemon.sort(function (a, b) {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    if (a.iv > b.iv) return -1;
                    if (a.iv < b.iv) return 1;
                    if (a.cp > b.cp) return -1;
                    if (a.cp < b.cp) return 1;
                    return 0;
                });
                break;
            case 'id':
                sortedPokemon.sort(function (a, b) {
                    if (a.id < b.id) return -1;
                    if (a.id > b.id) return 1;
                    if (a.iv > b.iv) return -1;
                    if (a.iv < b.iv) return 1;
                    if (a.cp > b.cp) return -1;
                    if (a.cp < b.cp) return 1;
                    return 0;
                });
                break;
            case 'cp':
                sortedPokemon.sort(function (a, b) {
                    if (a.cp > b.cp) return -1;
                    if (a.cp < b.cp) return 1;
                    if (a.iv > b.iv) return -1;
                    if (a.iv < b.iv) return 1;
                    return 0;
                });
                break;
            case 'iv':
                sortedPokemon.sort(function (a, b) {
                    if (a.iv > b.iv) return -1;
                    if (a.iv < b.iv) return 1;
                    if (a.cp > b.cp) return -1;
                    if (a.cp < b.cp) return 1;
                    return 0;
                });
                break;
            case 'time':
                sortedPokemon.sort(function (a, b) {
                    if (a.creationTime > b.creationTime) return -1;
                    if (a.creationTime < b.creationTime) return 1;
                    return 0;
                });
                break;
            case 'candy':
                sortedPokemon.sort(function (a, b) {
                    if (a.candy > b.candy) return -1;
                    if (a.candy < b.candy) return 1;
                    return 0;
                });
                break;
            default:
                sortedPokemon.sort(function (a, b) {
                    if (a.cp > b.cp) return -1;
                    if (a.cp < b.cp) return 1;
                    return 0;
                });
                break;
        }

        for (var j = 0; j < sortedPokemon.length; j++) {
            var pkmnNum = sortedPokemon[j].id,
                pkmnImage = this.addMissingZero(pkmnNum, 3) + '.png',
                pkmnName = this.pokemonsArray[pkmnNum - 1].Name,
                pkmnCP = sortedPokemon[j].cp,
                pkmnMove1 = {
                    name: this.movesArray[this.movesArrayIdsOrder[sortedPokemon[j].move1]].name,
                    type: this.movesArray[this.movesArrayIdsOrder[sortedPokemon[j].move1]].type
                },
                pkmnMove2 = {
                    name: this.movesArray[this.movesArrayIdsOrder[sortedPokemon[j].move2]].name,
                    type: (typeof this.movesArray[this.movesArrayIdsOrder[sortedPokemon[j].move2]].type === 'string' ?
                        this.movesArray[this.movesArrayIdsOrder[sortedPokemon[j].move2]].type :
                        'unknown')
                },
                pkmnIV = sortedPokemon[j].iv,
                pkmnIVA = sortedPokemon[j].attack,
                pkmnIVD = sortedPokemon[j].defense,
                pkmnIVS = sortedPokemon[j].stamina,
                pkmnMaxHP = sortedPokemon[j].maxHealth,
                candyNum = this.getCandy(pkmnNum, trainer),
                classIV = '';

            if (parseFloat(pkmnIV) >= 0.9) {
                classIV = ' green-text';
            } else if (parseFloat(pkmnIV) >= 0.8) {
                classIV = ' blue-text';
            } else if (parseFloat(pkmnIV) < 0.5) {
                classIV = ' red-text';
            }

            if (j % 4 === 0) {
                html += '<div class="row">';
            }

            html += '<div class="col s12 m6 l3 center poke-item' + classIV + '">' +
                '<div class="poke-title">' + pkmnName + ' (' + pkmnCP + ')</div>' +
                '<div class="col s4 poke-img">' +
                '<img src="image/pokemon/' + pkmnImage + '" class="png_img">' +
                '</div>' +
                '<div class="col s8 poke-stats">' +
                'HP <b>' + pkmnMaxHP + '</b><br/>' +
                'IV <b>' + pkmnIV + '</b> (' + pkmnIVA + '/' + pkmnIVD + '/' + pkmnIVS + ')<br/>' +
                '<div class="poke-moves">' +
                '<img src="image/types/' + pkmnMove1.type.toString().toLowerCase() + '.gif"> <span class="poke-move-name">' + pkmnMove1.name + '</span><br/>' +
                '<img src="image/types/' + pkmnMove2.type.toString().toLowerCase() + '.gif"> <span class="poke-move-name">' + pkmnMove2.name + '</span><br/>' +
                '</div>' +
                'Candy <b>' + candyNum + '</b>' +
                '</div>' +
                '</div>';

            if (j % 4 === 3 || j === sortedPokemon.length - 1) {
                html += '</div>';
            }
        }

        // Add incubators
        var incubators = this.getIncubators(trainer.eggs);
        for (var b = 0; b < incubators.length; b++) {
            if (b % 4 === 0) {
                html += '<div class="row">';
            }

            var incubator = incubators[b],
                currentTrainerStats = trainer.stats[0].inventory_item_data.player_stats,
                totalToWalk = incubator.target_km_walked - incubator.start_km_walked,
                kmsLeft = incubator.target_km_walked - currentTrainerStats.km_walked,
                walked = totalToWalk - kmsLeft,
                kmString = (parseFloat(walked).toFixed(1) || 0) + "/" + (parseFloat(totalToWalk).toFixed(1) || 0) + " km",
                img;

            if (incubator.item_id == 902) {
                img = 'EggIncubator';
            } else {
                img = 'EggIncubatorUnlimited';
            }

            html += '<div class="col s12 m6 l3 center poke-item">' +
                '<div class="poke-title">' + kmString + '</div>' +
                '<div class="col s12 poke-img">' +
                '<img src="image/items/' + img + '.png" class="png_img">' +
                '</div>' +
                '</div>';

            if (b % 4 === 3) {
                html += '</div>';
            }
        }

        // Add number of eggs
        html += '<div class="col s12 m6 l3 center poke-item">' +
            '<img src="image/items/Egg.png" class="png_img"><br/>' +
            '<b>You have ' + eggs + ' egg' + (eggs !== 1 ? "s" : "") +
            '</div>' +
            '</div>';

        html += '</div>';

        return html;
    },

    sortAndShowPokedex: function (sortOn, trainerName) {
        var trainer = this.trainerData[trainerName],
            sortedPokedex = [],
            html;

        if (!trainer.pokedex.length) return;

        html = '<div class="items">';
        for (var i = 0; i < trainer.pokedex.length; i++) {
            var pokedexData = trainer.pokedex[i].inventory_item_data.pokedex_entry,
                pkmID = pokedexData.pokemon_id,
                pkmName = this.pokemonsArray[pkmID - 1].Name,
                pkmType1 = this.pokemonsArray[pkmID - 1].TypeI,
                pkmType2 = (typeof this.pokemonsArray[pkmID - 1].TypeII !== 'undefined' ?
                    this.pokemonsArray[pkmID - 1].TypeII :
                    ''),
                pkmEnc = pokedexData.times_encountered,
                pkmCap = pokedexData.times_captured;

            sortedPokedex.push({
                "name": pkmName,
                "id": pkmID,
                "enc": (pkmEnc || 0),
                "cap": (pkmCap || 0),
                "type1": (pkmType1),
                "type2": (pkmType2)
            });
        }

        switch (sortOn) {
            case 'id':
                sortedPokedex.sort(function (a, b) {
                    return a.id - b.id;
                });
                break;
            case 'name':
                sortedPokedex.sort(function (a, b) {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                });
                break;
            case 'enc':
                sortedPokedex.sort(function (a, b) {
                    return a.enc - b.enc;
                });
                break;
            case 'cap':
                sortedPokedex.sort(function (a, b) {
                    return a.cap - b.cap;
                });
                break;
            default:
                sortedPokedex.sort(function (a, b) {
                    return a.id - b.id;
                });
                break;
        }
        for (var j = 0; j < sortedPokedex.length; j++) {
            var pkmnNum = sortedPokedex[j].id,
                pkmnImage = this.addMissingZero(pkmnNum, 3) + '.png',
                pkmnName = this.pokemonsArray[pkmnNum - 1].Name,
                pkmnEnc = sortedPokedex[j].enc,
                pkmnCap = sortedPokedex[j].cap,
                pkmnType1 = sortedPokedex[j].type1,
                pkmnType2 = sortedPokedex[j].type2,
                candyNum = this.getCandy(pkmnNum, trainer),
                isNotCaughtClass = '';

            if (j % 4 === 0) {
                html += '<div class="row">';
            }

            if (pkmnCap === 0) {
                isNotCaughtClass = ' not-caught grey-text';
            }

            html += '<div class="col s12 m6 l3 center poke-item' + isNotCaughtClass + '">' +
                '<div class="poke-title">#' + pkmnNum + ' ' + pkmnName + '</div>' +
                '<div class="col s4 poke-img">' +
                '<img src="image/pokemon/' + pkmnImage + '" class="png_img">' +
                '</div>' +
                '<div class="col s8 poke-stats">' +
                'Times Seen <b>' + pkmnEnc + '</b><br/>' +
                'Times Caught <b>' + pkmnCap + '</b><br/>' +
                'Candy <b>' + candyNum + '</b>' +
                '<div class="poke-types">' +
                '<span class="poke-type-name">Type 1</span> <img src="image/types/' + pkmnType1.toString().toLowerCase() + '.gif"><br/>' +
                '<span class="poke-type-name">Type 2</span> ' + ((pkmnType2 !== '') ? '<img src="image/types/' + pkmnType2.toString().toLowerCase() + '.gif">' : '<span class="poke-type-name"><b>None</b></span>') +
                '<br/>' +
                '</div>' +
                '</div>' +
                '</div>';

            if (j % 4 === 3 || j === sortedPokedex.length - 1) {
                html += '</div>';
            }
        }

        html += '</div>';

        return html;
    },

    getIncubators: function (incubators) {
        var incubatorsReturn = [];

        for (var a = 0; a < incubators.length; a++) {
            var incubator = incubators[a].inventory_item_data.egg_incubators.egg_incubator;
            if (Array.isArray(incubator)) {
                for (var b = 0; b < incubator.length; b++) {
                    var incubatorUnder = incubator[b];
                    incubatorsReturn.push(incubatorUnder);
                }
            } else {
                incubatorsReturn.push(incubator);
            }
        }

        return incubatorsReturn;
    },

    getCandy: function (p_num, trainer) {
        for (var i = 0; i < trainer.bagCandy.length; i++) {
            var checkCandy = trainer.bagCandy[i].inventory_item_data.candy.family_id;
            if (this.candiesArray[p_num] === checkCandy) {
                return (trainer.bagCandy[i].inventory_item_data.candy.candy || 0);
            }
        }
    },

    getTeam: function (trainerName) {
        var playerInfo = this.trainerData[trainerName].player;

        if (playerInfo && typeof playerInfo !== 'undefined' && playerInfo.length !== 0) {
            return playerInfo.team;
        } else {
            this.errorLog('No team was found for ' + trainerName + '.');
            return 0;
        }
    },

    setInventoryData: function (data, trainerName) {
        if (typeof trainerTools.trainerData[trainerName] === 'undefined') {
            trainerTools.trainerData[trainerName] = {};
        }

        trainerTools.trainerData[trainerName].bagCandy = trainerTools.filterInventory(data.inventory_items, 'candy');
        trainerTools.trainerData[trainerName].bagItems = trainerTools.filterInventory(data.inventory_items, 'item');
        trainerTools.trainerData[trainerName].bagPokemon = trainerTools.filterInventory(data.inventory_items, 'pokemon_data');
        trainerTools.trainerData[trainerName].eggs = trainerTools.filterInventory(data.inventory_items, 'egg_incubators');
        trainerTools.trainerData[trainerName].pokedex = trainerTools.filterInventory(data.inventory_items, 'pokedex_entry');
        trainerTools.trainerData[trainerName].stats = trainerTools.filterInventory(data.inventory_items, 'player_stats');

        trainerTools.trainerData[trainerName].lastUpdateTimestamp = data.new_timestamp_ms;
    },

    setPlayerData: function (data, trainerName) {
        if (typeof trainerTools.trainerData[trainerName] === 'undefined') {
            trainerTools.trainerData[trainerName] = {};
        }
        trainerTools.trainerData[trainerName].player = data;
    },

    setSettingsData: function (data, trainerName) {
        if (typeof trainerTools.trainerData[trainerName] === 'undefined') {
            trainerTools.trainerData[trainerName] = {};
        }
        trainerTools.trainerData[trainerName].settings = data;
    },

    doARemoteScan: function (location) {
        var remoteUrl = trainerTools.settings.remoteServer.url + '/doScan',
            logoButton = $('#scan-logo');

        $.ajax({
            url: remoteUrl,
            type: "POST",
            data: {
                location: location,
                debug: 'false'
            },
            success: function (data) {
                if (data === 'success') {
                    trainerTools.successLog('New data successfully retrieved from remote server.');
                    // Refresh page
                    trainerTools.loadTrainers();
                    // Design view
                    setTimeout(function () {
                        trainerTools.initView();
                    }, 1000);
                } else {
                    trainerTools.errorLog('Failed to scan for new data', true);
                }
            },
            error: function () {
                trainerTools.errorLog('Failed to scan for new data', true);
            },
            complete: function () {
                logoButton.removeClass('waiting');
            }
        });
    },

    loadJSON: function (path, successCallback, successData, errorCallback, errorMessage, addToast) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', path + "?v=" + Date.now(), true);
        xhr.send();

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    if (successCallback) {
                        successCallback(JSON.parse(xhr.responseText.replace(/\bNaN\b/g, 'null')), successData);
                    }
                } else if (errorCallback) {
                    if (errorMessage && typeof errorMessage === 'string') {
                        errorCallback(errorMessage, addToast);
                    } else {
                        errorCallback(path + ': ' + xhr.statusText + ' (' + xhr.status + ')', addToast);
                    }
                }
            }
        };
    },

    infoLog: function (message, addToast) {
        trainerTools.log({
            message: message,
            color: "blue-text"
        }, addToast, 'blue');
    },

    successLog: function (message, addToast) {
        trainerTools.log({
            message: message,
            color: "green-text"
        }, addToast, 'green');
    },

    errorLog: function (message, addToast) {
        trainerTools.log({
            message: message,
            color: "red-text"
        }, addToast, 'red');
    },

    errorLogAndConsole: function (message, addToast) {
        console.error(message);

        trainerTools.log({
            message: message,
            color: "red-text"
        }, addToast, 'red');
    },

    log: function (log, addToast, toastClass) {
        var currentDate = new Date(),
            time = ('0' + currentDate.getHours()).slice(-2) + ':' + ('0' +
                (currentDate.getMinutes())).slice(-2) + ':' +
                ('0' + currentDate.getSeconds()).slice(-2),
            logLine;

        // Write log line
        logLine = "<div class='log-item'>" +
            "<span class='log-date'>" + time + " - </span>" +
            "<span class='" + log.color + "'>" + log.message + "</span>" +
            "</div>";

        $("#logs-panel .card-content").append(logLine);

        // show a toast if addToast = true
        if (addToast && typeof addToast !== 'undefined') {
            var toastDesign = 'rounded';
            if (toastClass && toastClass !== '') {
                toastDesign += ' ' + toastClass;
            }
            Materialize.toast(log.message, 2500, toastDesign);
        }
    },

    filterInventory: function (arr, search) {
        var filtered = [];

        for (var i = 0; i < arr.length; i++) {
            if (arr[i].inventory_item_data[search] != undefined) {
                filtered.push(arr[i]);
            }
        }
        return filtered;
    },

    timeConverterFullDate: function (timestamp) {
        var datetime = new Date(timestamp);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var year = datetime.getFullYear();
        var month = months[datetime.getMonth()];
        var date = datetime.getDate();
        var hour = datetime.getHours() < 10 ? '0' + datetime.getHours() : datetime.getHours();
        var min = datetime.getMinutes() < 10 ? '0' + datetime.getMinutes() : datetime.getMinutes();
        var sec = datetime.getSeconds() < 10 ? '0' + datetime.getSeconds() : datetime.getSeconds();
        return date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    },

    addMissingZero: function (number, length) {
        var my_string = '' + number;

        while (my_string.length < length) {
            my_string = '0' + my_string;
        }
        return my_string;
    }
};