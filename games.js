// Guard against double-loading
if (window._gamesLoaded) { throw new Error('games.js already loaded'); }
window._gamesLoaded = true;
/* Console locked by security.js — loaded before this script in clocker.html */

/* =====================================================
   EMERGENCY PANIC REDIRECT
===================================================== */
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.location.replace("https://drive.google.com/drive/my-drive");
    }
});

/* =====================================================
   GAME FILES AND LOGIC
===================================================== */
/* =====================================================
   GAME FILE LIST
   ~2698 entries — each maps to a file name on the CDN:
   https://cdn.jsdelivr.net/gh/taekfighter/ugs-singlefile/UGS-Files/<name>

   TO ADD A GAME: append the filename (without path) to this array.
   TO REMOVE A GAME: delete its line.
   Keep entries sorted alphabetically for sanity.
   Prefix "cl" is part of the actual filename on the CDN.
===================================================== */
let files = [
  "cl1",
  "cl100RoomsOfEnemies",
  "cl10bullets",
  "cl10minutestildawn",
  "cl10morebullets",
  "cl12minibattles",
  "cl13bones",
  "cl1on1soccer",
  "cl1v1lol",
  "cl1v1tennis",
  "cl2048",
  "cl2048cupcakes",
  "cl20smallmazes",
  "cl234playergame",
  "cl2Dshooting",
  "cl2doom",
  "cl3dash",
  "cl3dasheditor",
  "cl3dpinballspacecadet",
  "cl3pandas",
  "cl3pandasbrazil",
  "cl3pandasfantasy",
  "cl3pandasjapan",
  "cl3pandasnight",
  "cl3slices2",
  "cl40xescape",
  "cl4thandgoal",
  "cl500calibercontractz",
  "cl60secondsburgerrun",
  "cl60secondssantarun",
  "cl64in1nes",
  "cl8ballclassic",
  "cl8ballpool",
  "cl9007199254740992",
  "cl90in1nes",
  "cl99balls",
  "cl99nightsitf",
  "clA Walk in The Forest (v10)",
  "clADOFAI",
  "clADarkRoom",
  "clAcko_s Mach Bike Challenge (v10)",
  "clAdventureCapatalist",
  "clAltered Beast",
  "clAwesomePirates",
  "clB3313",
  "clBFDIBranches",
  "clBMX2",
  "clBTD1",
  "clBank Robbery",
  "clBig_Time_Butter_Baron",
  "clBonanza-Bros",
  "clBountyOfOne",
  "clBrawlstars",
  "clBusterJam",
  "clCartoonNetworkTableTennisUltimateTournament",
  "clCeliasStupidROMHack",
  "clCellToSingularity",
  "clChickenCS",
  "clCircloO2",
  "clCrystalCastles",
  "clDKNESCollection",
  "clDKNESCollection(1)",
  "clDashmetry",
  "clDragonBallZTheLegacyofGoku",
  "clDragonQuestIX",
  "clDragonxclient",
  "clEaglercraft-Alpha-126-Offline",
  "clEaglercraft-Beta-1.3-Offline",
  "clEaglercraft-Beta-13-Offline",
  "clEaglercraft-Indev-Offline",
  "clEaglercraft-Indev-Offline (1)",
  "clEaglercraft-Indev-Offline(1)",
  "clEaglercraft-Indev-Offline(2)",
  "clEaglercraftL_19_v0_7_0_Offline_Signed",
  "clEaglercraftL_19_v0_7_0_Offline_Signed(1)",
  "clFF3",
  "clFFsonic1",
  "clFFsonic2",
  "clFFsonic3",
  "clFFsonic4",
  "clFFsonic5",
  "clFFsonic61",
  "clFFsonic62",
  "clFIFA07",
  "clFIFA10",
  "clFIFA11",
  "clFIFA2000(1)",
  "clFIFA2000(2)",
  "clFIFA99",
  "clFIFAinternationalsoccer",
  "clFIFAroadtoworldcup98",
  "clFIFAsoccer06",
  "clFIFAsoccer95",
  "clFIFAsoccer96",
  "clFIFAsoccer97",
  "clFIFAstreet2",
  "clFNAF",
  "clFNAF2",
  "clFNAF3",
  "clFNAF4",
  "clGain Ground",
  "clGettothetopalthoughthereisnotop",
  "clGoldenSunTheLostAge",
  "clHaroldsbadday",
  "clHelios-Offline",
  "clHelios-Offline (1)",
  "clHiNoHomo",
  "clHighSpeed",
  "clHoennsLastWish",
  "clInkwell (v104)",
  "clJUMP",
  "clKenGriffeyJrPresentsMajorLeagueBaseball",
  "clLSE",
  "clLearnToFly3Debug",
  "clLegacyOfGoku",
  "clMINECRAFTTOWERDEFENSE",
  "clMario Party Advance",
  "clMarioisMissingDoneRight",
  "clMarvelSuperHeroesArcade",
  "clMarvelVsCapcomPS1",
  "clMarvelVsStreetFighter",
  "clMetalSonicHyperdrive",
  "clMinceraft-I-NotMine_V6",
  "clMinceraft-I-NotMine_V6(1)",
  "clMoemon Emerald Vanilla+ (v110)",
  "clNBAhangtime",
  "clNBAjam",
  "clNautilusOS",
  "clNautilusOS(1)",
  "clNewSuperMarioWorld2AroundtheWorld",
  "clNicktoonsFreezeFrameFrenzy",
  "clNutsandBoltsScrewingPuzzle",
  "clOotMasterQuest",
  "clOrangeRoulette",
  "clOutrunArcade",
  "clOutrunGenesis",
  "clPVZM",
  "clPaperMarioDSE",
  "clPaperMarioPracticeHack",
  "clPokeAmbrosia",
  "clPokeEmeraldRogueEX",
  "clPokeFusion3",
  "clPokeHeartgoldGenerations",
  "clPokeThetaEmeraldEX",
  "clPokemonemeraldrouge",
  "clPokemonrocketedition",
  "clPokémon Emerald Rush Edition (20)",
  "clPokémon TWO (v11)",
  "clPokémon Trade&_Stache (V11)",
  "clPokémonstunningsteel",
  "clQuantumClicker",
  "clSINGLEFILE",
  "clSM64Land",
  "clSSF2Arcade",
  "clSSF2TArcade",
  "clScamptonTheGreatFightRecreate",
  "clSegaSonicTheHedgehog",
  "clSkyRiders",
  "clSmash Hit Ripoff",
  "clSnowBrosGenesis",
  "clSonic & Knuckles + Sonic The Hedgehog 3",
  "clSonic1ScoreRush",
  "clSonic1TheSuperChallenges",
  "clSonic2ScoreRush",
  "clSonicClassics",
  "clSonicHellfireSaga",
  "clSonicInSM64",
  "clSonicinSMW",
  "clSonicinSMW(1)",
  "clSovereignoftheskys",
  "clSpongebobPowerKartGrandPrix",
  "clSportsHeadsIceHockey",
  "clStickmanKingdomclash",
  "clStreetFighter1Arcade",
  "clStreetFighter2Arcade",
  "clStreetFighter2CEArcade",
  "clStreetFighter2HFArcade",
  "clStreetFighter2HFArcade(1)",
  "clSuperMarioWorldThe SecretOfThe7GoldenStatues",
  "clSuperPunchOutEN",
  "clSupremeDuelist2019",
  "clTaikonoTatsujin",
  "clTheLoneRanger",
  "clTheSunForTheVampire",
  "clUZG",
  "clUltimatecardrivingsimulator",
  "clVSSMB",
  "clXMenChildrenOfTheAtomArcade",
  "clXMenVSStreetFighter",
  "clXevious",
  "clYoshisStrangeQuest",
  "clZeldaIndigoch2",
  "clabandoned3",
  "clabsolutemadness",
  "clacecombat2",
  "clacecombat3",
  "clacegangstertaxi",
  "clachievementunlocked",
  "clachievmentunlocked",
  "clachievmentunlocked2",
  "clachievmentunlocked3",
  "clachillies",
  "clachillies2",
  "cladatewithdeath",
  "cladayintheoffice",
  "cladvancewars",
  "cladvancewars2",
  "cladvancewarsdualstrike",
  "cladventneon",
  "cladventurecapitalist",
  "claflac",
  "claftertheweek",
  "clagariolite",
  "clageofwar",
  "clageofwar2",
  "clagesofconflict",
  "clagesofempire",
  "clahoysurvival",
  "clai",
  "clairlinetycoonidle",
  "clakoopasrevenge",
  "clakoopasrevenge2",
  "clakumanorgaiden",
  "claladdinsnes",
  "clalexkiddinmiracleworld",
  "clalienhominid",
  "clalienhominidgba",
  "clalienskyinvasion",
  "clalientransporter",
  "clalienvspredator",
  "clallbossesin1",
  "clallocation",
  "clamaze",
  "clambulencearush",
  "clamidstthesky",
  "clamigopancho",
  "clamigopancho2",
  "clamigopancho3",
  "clamigopancho4",
  "clamigopancho5",
  "clamigopancho6",
  "clamigopancho7",
  "clamongus",
  "clamorphous",
  "clancientsins",
  "clanemonesfall",
  "clangry-birdsspace",
  "clangrybirds",
  "clangrybirds-space",
  "clangrybirdsshowdown",
  "clangrybirdsspace",
  "clanimalcrossingwildworld",
  "clanimalforestn64",
  "clannsmb",
  "clanotherworld",
  "clantarttycoon",
  "clantimatterdimensions",
  "clapesvshelium",
  "clapotris",
  "clappleshooter",
  "clappleworm",
  "claquaparkio",
  "clarceuslegend",
  "clarcheryworldtour",
  "clarchesspelago",
  "clarena",
  "clarmormayhem2",
  "clarsonate",
  "clarthursnightmare",
  "clascent",
  "clasdutydemands",
  "clasmallworldcup",
  "classesmentexaminationque",
  "classessmentexamination",
  "clasteroids",
  "clasteroidsALT",
  "clasteroidsarcade",
  "clastynax",
  "clatariadventure",
  "clattackhole",
  "clavalanche",
  "claviamasters",
  "claviamastersbuggy",
  "clawesomeplanes",
  "clawesometanks",
  "clawesometanks2",
  "claxbattler",
  "claxisfootballleague",
  "clb3313unabandonedA2",
  "clb3313v102",
  "clbabeltower",
  "clbabychiccoadventure",
  "clbabykaizo",
  "clbabysniperinvietnam",
  "clbackrooms",
  "clbackrooms2D",
  "clbackyardbaseball",
  "clbackyardbaseball09",
  "clbackyardbaseball10",
  "clbackyardfootball",
  "clbackyardsoccer",
  "clbaconmaydie",
  "clbadbodyguards",
  "clbadicecream",
  "clbadicecream2",
  "clbadicecream3",
  "clbadmondaysimulator",
  "clbadparenting",
  "clbadpiggies",
  "clbadpiggieslatest",
  "clbadtimesim",
  "clbadtimesimulator",
  "clbalatrogba",
  "clbaldicaseoh",
  "clbaldidecomp",
  "clbaldiepstein",
  "clbaldisbasics",
  "clbaldisbasicsremaster",
  "clbaldisfunnewschoolultimate",
  "clballblast",
  "clballistic",
  "clballsandbricks",
  "clballsandbricksgood",
  "clballz",
  "clbananasimulator",
  "clbanbuds",
  "clbanditgunslingers",
  "clbanjokazooie",
  "clbanjotooie",
  "clbankbreakout2",
  "clbankrobbery2",
  "clbarryhasasecret",
  "clbartblast",
  "clbas",
  "clbaseballbros",
  "clbasketballfrvr",
  "clbasketballlegends",
  "clbasketballlegends(1)",
  "clbasketballstars",
  "clbasketballsuperstars",
  "clbasketbattle",
  "clbasketbros",
  "clbasketrandom",
  "clbasketrandomgood",
  "clbasketslamdunk2",
  "clbatterup",
  "clbattlekarts",
  "clbattles",
  "clbattlesim",
  "clbattlezone",
  "clbazookaboy",
  "clbballlegend",
  "clbeachboxingsim",
  "clbeamrider",
  "clbearbarians",
  "clbearsus",
  "clbejeweledtwistds",
  "clbejeweledtwistflash",
  "clben10alienforce",
  "clben10omniverse",
  "clben10protector",
  "clben10racing",
  "clben10ultimatealien",
  "clbendrowned",
  "clbergentruck201x",
  "clbfdia5b",
  "clbigflappytowertinysquare",
  "clbigicetowertinysquare",
  "clbigneontowertinysquare",
  "clbigshotboxing2",
  "clbigtowertinysquare",
  "clbigtowertinysquare2",
  "clbigtowertinysquare2good",
  "clbindingofisaccsheeptime",
  "clbioevil4",
  "clbitlife",
  "clbitlifeencrypted",
  "clbitplanes",
  "clblackjack",
  "clblackjackbattle",
  "clblackjackhhhh",
  "clblackknight",
  "clblackout",
  "clblacksmithlab",
  "clblastronaut",
  "clblazedrifter",
  "clbleachvsnaruto",
  "clblightborne",
  "clblobsstory2",
  "clblockblast",
  "clblockblastv2",
  "clblockcraftparkour",
  "clblockcraftshooter",
  "clblockpost",
  "clblockthepig",
  "clblockydemolitionderby",
  "clblockysnakes",
  "clblood",
  "clbloodmoney",
  "clbloodtournament",
  "clbloons",
  "clbloons2",
  "clbloonsTD1",
  "clbloonsTD2",
  "clbloonsTD3",
  "clbloonsTD4",
  "clbloonsTD5",
  "clbloonsTD6scratch",
  "clbloonspp1",
  "clbloonspp2",
  "clbloonspp3",
  "clbloonspp4",
  "clbloonspp5",
  "clbloxorz",
  "clblumgiracers",
  "clblumgirocket",
  "clbntts",
  "clbobasimulator",
  "clbobtherobber",
  "clbobtherobber2",
  "clbobtherobber5",
  "clbollybeat",
  "clbomberman",
  "clbomberman2",
  "clbombermanhero",
  "clbombermanworld",
  "clbonkerssnes",
  "clboomslingers",
  "clbottlecracks",
  "clbottleflip3d",
  "clbotwds",
  "clbounceback",
  "clbouncemasters",
  "clbouncybasketball",
  "clbouncymotors",
  "clbowlalt",
  "clbowmaster",
  "clboxhead2playrooms",
  "clboxheadnightmare",
  "clboxinglive-2",
  "clboxinglive2",
  "clboxingrandom",
  "clbrainrot",
  "clbrawlsimulator3d",
  "clbreadskate",
  "clbridgerace",
  "clbrotato",
  "clbtd5",
  "clbtts",
  "clbtts2",
  "clbubbleshooter",
  "clbubbleshooterpirate",
  "clbubbletanks",
  "clbubbletanks2",
  "clbubbletanks3",
  "clbubbletanksarenas",
  "clbubbletankstd",
  "clbubsy",
  "clbuckshotroulette",
  "clbuildnowgg",
  "clbulletforce",
  "clbunnyland",
  "clbunzobunny",
  "clburgerandfrights",
  "clburgertime",
  "clburritobison",
  "clburritobison2",
  "clburritobisonlaunchalibre",
  "clburritobisonrevenge",
  "clbushidoblade",
  "clcactusmccoy",
  "clcactusmccoy(1)",
  "clcactusmccoy2",
  "clcactusmccoy2(1)",
  "clcactusmccoy2(2)",
  "clcallofbattle",
  "clcamilla",
  "clcandybox1",
  "clcannonballs3d",
  "clcannonfodder",
  "clcaptainlang",
  "clcaptchaware",
  "clcapybaraclicker",
  "clcarcrash3",
  "clcardrawing",
  "clcareatscar2deluxe",
  "clcarkingarena",
  "clcarmods",
  "clcarrampvspolicechase",
  "clcarstuntsdriving",
  "clcastaway",
  "clcastlebloodline",
  "clcastlecircleofmoon",
  "clcastlevania",
  "clcastlevania2",
  "clcastlevania3",
  "clcastlevaniaariaofsorrow",
  "clcastlevaniadawnofsorrow",
  "clcastlevanianes",
  "clcastlewarsmodern",
  "clcatmario",
  "clcatmariogood",
  "clcatslovecake2",
  "clcavecrawler",
  "clcavestory",
  "clceleste",
  "clceleste2",
  "clcelestemariodx",
  "clcellardoor",
  "clcentipedearcade",
  "clchainofmemories",
  "clchaosfaction2",
  "clcheckers",
  "clcheesechompers3d",
  "clcheeseisthereason",
  "clcheeserolling",
  "clcheshireinachatroom",
  "clchess",
  "clchessclassic",
  "clchibiknight",
  "clchickenscream",
  "clchickenwar",
  "clchipschallenge",
  "clchoppyorc",
  "clchoroqwonderful",
  "clchronotrigger",
  "clchuzzle",
  "clciviballs",
  "clciviballs2",
  "clclashnslash",
  "clclashofvikings",
  "clclassof09",
  "clclaymore",
  "clclayuncraft",
  "clcleanupio",
  "clclearvision",
  "clclearvision2",
  "clclearvision3",
  "clclearvision4",
  "clclearvision5",
  "clclimbforbrainrots",
  "clclmadnessambulation",
  "clclover",
  "clclubbytheseal",
  "clclusterrush",
  "clcoalllcdemo",
  "clcod4",
  "clcodblackopp",
  "clcoddefiance",
  "clcodenamegordon",
  "clcodeorg",
  "clcodeorgbutoffline",
  "clcodercraft",
  "clcodmodernwarfare",
  "clcodworldatwar",
  "clcoffeemaker",
  "clcoldpines",
  "clcolorburst3d",
  "clcolormatch",
  "clcolorwatersort3d",
  "clcombopool",
  "clcommandandconquer",
  "clcommanderkeen4",
  "clcommanderkeen5",
  "clcommanderkeen6",
  "clconfrontingurself",
  "clconfrontingyourself",
  "clconkersbadfurday",
  "clcontra",
  "clcontra3",
  "clcookie-clicker",
  "clcookieclicker",
  "clcookieclickercool",
  "clcookieclickergood",
  "clcookieclickermodmenu",
  "clcookingmama",
  "clcookingmama2",
  "clcookingmama3",
  "clcoreball",
  "clcoryinthehouse",
  "clcotlk",
  "clcountmastersstickmangames",
  "clcoverorange",
  "clcoverorange2",
  "clcoverorangejourneygangsters",
  "clcoverorangejourneyknights",
  "clcoverorangejourneypirates",
  "clcoverorangejourneyspace",
  "clcoverorangeplayerspack",
  "clcoverorangeplayerspack2",
  "clcoverorangeplayerspack3",
  "clcoverorangeplayerspack3(1)",
  "clcrankit",
  "clcrankit!",
  "clcrash2",
  "clcrash3",
  "clcrashbandicoot",
  "clcrashbandicoot (1)",
  "clcrashbandicoot2",
  "clcrashteamracing",
  "clcrazycars",
  "clcrazycattle3d",
  "clcrazychicken3D",
  "clcrazyclimber",
  "clcrazyfrogracer",
  "clcrazymotorcycle",
  "clcrazypenguincatapult",
  "clcrazyplanelanding",
  "clcrazytaxigba",
  "clcreaturecardidle",
  "clcreeperworld2",
  "clcreepyinternetstories",
  "clcreepynightfunkin",
  "clcrimsonmadness",
  "clcrossyroad",
  "clcrunchball3000",
  "clcs16",
  "clcs6",
  "clcsds",
  "clcsgoclicker",
  "clctgpnitro",
  "clcurveball",
  "clcurveball(1)",
  "clcustomersupport",
  "clcuttherope",
  "clcuttheropeholiday",
  "clcuttheropetimetravel",
  "clcvooc",
  "clcyberbungracing",
  "clcybersensation",
  "cldadgame",
  "cldadish",
  "cldadnme",
  "cldaggerfall",
  "cldandysworldclicker",
  "cldanktomb",
  "cldasharena",
  "cldashio",
  "cldatewithiraq",
  "cldborigins",
  "cldborigins2",
  "cldbsniper",
  "cldbzattacksaiyans",
  "cldbzdevolution",
  "cldbzsuperwarriorssonic",
  "cldbzwarriors2",
  "clddlc64",
  "cldeadair",
  "cldeadestate",
  "cldeadfrontieroutbreak",
  "cldeadfrontieroutbreak2",
  "cldeadlydescent",
  "cldeadplate",
  "cldeadseat",
  "cldeadzed",
  "cldeadzed2",
  "cldeathchase",
  "cldeathrun",
  "cldeblob2",
  "cldecision",
  "cldecision2",
  "cldecision3",
  "cldecisionmedieval",
  "cldeepersleep",
  "cldeepestsword",
  "cldeepsleep",
  "cldefenderarcade",
  "cldefendyourcastle",
  "cldefendyournuts",
  "cldefendyournuts2",
  "cldeltarune",
  "cldeltatraveler",
  "cldementium",
  "cldemolitionderbycrashracing",
  "cldemonblade",
  "cldemonbluff",
  "cldiablo",
  "cldiamondhollow",
  "cldiamondhollow2",
  "cldiddykong-racing",
  "cldieinthedungeon",
  "cldigdeep",
  "cldigdug",
  "cldigdug2",
  "cldigdug26",
  "cldigtochina",
  "cldimensionalincident",
  "cldinodudes",
  "cldinorun",
  "cldinorunenterplanetd",
  "cldinorunmarathonofdoom",
  "cldiredecks",
  "cldkccompetitioncart",
  "cldoblox",
  "cldogeminer",
  "cldogeminer2",
  "cldokidokiliteratureclub",
  "cldomeromantik",
  "cldonkeykong",
  "cldonkeykong64",
  "cldonkeykong94",
  "cldonkeykongcountry",
  "cldonkeykongcountry2",
  "cldonkeykongcountry3",
  "cldonkeykongnes",
  "cldontescape",
  "cldontescape2",
  "cldontescape3",
  "cldontyoulecturemehtml",
  "cldoodlejump",
  "cldoodlejumpgoober",
  "cldoom",
  "cldoom2",
  "cldoom2d",
  "cldoom2dDOS",
  "cldoom2dos",
  "cldoom3pack",
  "cldoom64",
  "cldoomdos",
  "cldoomemscripten",
  "cldoomps",
  "cldoompsalt",
  "cldoomzio",
  "cldoorscastle",
  "cldoswasmx",
  "cldoubledribble",
  "cldouchebaglife",
  "cldouchebagworkout",
  "cldouchebagworkout2",
  "cldownthemountain",
  "cldragonballadvance",
  "cldragonquest5ds",
  "cldragonwarriormonsters",
  "cldrawclimber",
  "cldrawntolife",
  "cldrawntolife2",
  "cldrawtheline",
  "cldreader",
  "cldreadheadparkour",
  "cldriftboss",
  "cldrifthuntersmerge",
  "cldriftsimulator",
  "cldrivemady",
  "cldrivenwild",
  "cldriverussia",
  "cldrmario",
  "cldrweedgaster",
  "cldta6",
  "cldubstep",
  "clduckhunt",
  "clducklfe5",
  "clducklife",
  "clducklife2",
  "clducklife3",
  "clducklife4",
  "clducklifebattle",
  "clducklifespace",
  "clducklingsio",
  "clducktales",
  "clducktales2",
  "cldud",
  "cldukenukem2",
  "cldukenukem3d",
  "cldumbwaystodie",
  "cldumpling",
  "cldunebuggy",
  "cldungeondeck",
  "cldungeonraid",
  "cldungeonsanddegenerategamblers",
  "cldunkshot",
  "clduskchild",
  "cldyingdreams",
  "cldynamiteheaddy",
  "cleaglercraft152",
  "cleaglercraftnebula",
  "cleagleride",
  "clearntodie",
  "clearntodie2",
  "clearthbound",
  "clearthbound3",
  "clearthboundsnes",
  "clearthtaken",
  "clearthtaken2",
  "clearthtaken3",
  "clearthwormgg",
  "clearthwormjim",
  "clearthwormjim (1)",
  "clearthwormjim2",
  "clearthwormjim2 (1)",
  "cledelweiss",
  "cledyscarsimulator",
  "cleffinghail",
  "cleffingmachines",
  "cleffingworms",
  "cleffingzombies",
  "clegg",
  "cleggycar",
  "clelasticface",
  "clelectricman2",
  "clelevatoraction",
  "clelytraflight",
  "clemujs",
  "clenchain",
  "clendacopia",
  "clendlesswar4",
  "clendlesswar5",
  "clendlesswar5wow",
  "clendlesswar7",
  "clenduro",
  "clepicbattlefantasy5",
  "clescalatingduel",
  "clescaperoad",
  "clescaperoadcity2",
  "clescapeschoolduel",
  "clet",
  "cletrianoddyssey",
  "cleurovisionsim",
  "clevilglitch",
  "clevolution",
  "clexcitebike64",
  "clexitpath",
  "clexoobservation",
  "clextremerun3d",
  "clfactoryballs",
  "clfactoryballs2",
  "clfactoryballs3",
  "clfactoryballs4",
  "clfairytalevsonepiece",
  "clfallguys",
  "clfallout",
  "clfamidash",
  "clfamidash128",
  "clfamidashAlbum128",
  "clfamidashBSides128",
  "clfamidashCSides128",
  "clfamidashDSides128",
  "clfamilyguycorrupted",
  "clfancypantsadventure",
  "clfancypantsadventure2",
  "clfancypantsadventure3",
  "clfancysnowboarding",
  "clfantasyzone",
  "clfashionbattle",
  "clfattygenius",
  "clfearassessment",
  "clfearstofathomhomealone",
  "clfeedthevoid",
  "clfeedus",
  "clfeedus2",
  "clfeedus3",
  "clfeedus4",
  "clfeedus5",
  "clff2ws",
  "clff6",
  "clffaf",
  "clffmysticquest",
  "clfifa2000",
  "clfinalearth2",
  "clfinalfantasy",
  "clfinalfantasy2nes",
  "clfinalfantasy3nes",
  "clfinalfantasyII",
  "clfinalfantasyIX",
  "clfinalfantasyVI",
  "clfinalfantasyVII",
  "clfinalfantasyVIId2",
  "clfinalfantasyVIId3",
  "clfinalfantasyVIItheothertetrr",
  "clfinalfantasylegend2",
  "clfinalfantasytactics",
  "clfinalninja",
  "clfindthealien",
  "clfireblob",
  "clfireboyandwatergirl",
  "clfireboyandwatergirl2",
  "clfireboyandwatergirl3",
  "clfireboyandwatergirl5",
  "clfireboyandwatergirl6",
  "clfireemblem",
  "clfisheatgettingbig",
  "clfisquarium",
  "clfivenightsatbaldisredone",
  "clfivenightsatepsteins",
  "clfivenightsatshreks",
  "clfivenightsatshrekshotel",
  "clfivenightsatyoshis",
  "clflappybird",
  "clflashsonic",
  "clfloodrunner",
  "clfloodrunner2",
  "clfloodrunner4",
  "clfluidism",
  "clfnac1",
  "clfnac2",
  "clfnaf3remastered",
  "clfnaf4halloween",
  "clfnafanimatronics",
  "clfnafps",
  "clfnafshooter",
  "clfnafsl",
  "clfnafucn",
  "clfnafworldd",
  "clfnaw",
  "clfnfTWIDDLEFINGER",
  "clfnfaethos",
  "clfnfagoti",
  "clfnfakage",
  "clfnfanimation",
  "clfnfannie",
  "clfnfasdf",
  "clfnfbelowdepths",
  "clfnfbfdi26",
  "clfnfbinarybreakdown",
  "clfnfblackbetrayal",
  "clfnfbside",
  "clfnfcamelliarudeblaster",
  "clfnfcandycarrier",
  "clfnfchara",
  "clfnfcitytales",
  "clfnfclassified",
  "clfnfcorrosion",
  "clfnfcory",
  "clfnfcrunchin",
  "clfnfdeciever",
  "clfnfdesolation",
  "clfnfdocumictxtv3",
  "clfnfdokitakeoverplus",
  "clfnfdropandroll",
  "clfnfdsides",
  "clfnfdustin",
  "clfnfdusttale",
  "clfnffleetway",
  "clfnfflippedout",
  "clfnffnaf1",
  "clfnffnaf2",
  "clfnffnaf3",
  "clfnffnatpt",
  "clfnfgamebreakerbundle",
  "clfnfgfmode",
  "clfnfgodot",
  "clfnfgoldenapple",
  "clfnfhank",
  "clfnfheartbreakhavoc",
  "clfnfherobrine",
  "clfnfhex",
  "clfnfholiday",
  "clfnfhorkglorpgloop",
  "clfnfhotline",
  "clfnfhypnoslullaby",
  "clfnfimposter3",
  "clfnfimposterv4",
  "clfnfindiecross",
  "clfnfinfernalbout",
  "clfnfinfiniteirida",
  "clfnfironlung",
  "clfnfjapcreepypasta",
  "clfnfmadnesspoop",
  "clfnfmaginagematches",
  "clfnfmariomadnessdside",
  "clfnfmarioport",
  "clfnfmcmadness",
  "clfnfmidfight",
  "clfnfmiku",
  "clfnfmobmod",
  "clfnfneo",
  "clfnfpiggyfield",
  "clfnfplutoshi",
  "clfnfpokepastaperdition",
  "clfnfporifera",
  "clfnfqt",
  "clfnfremnants",
  "clfnfretrospecter",
  "clfnfrevmixed",
  "clfnfrewrite",
  "clfnfrhythmicrev",
  "clfnfrottensmoothie",
  "clfnfselfpaced",
  "clfnfshaggy4keys",
  "clfnfshaggyxmatt",
  "clfnfshucks-v2",
  "clfnfshucksv2",
  "clfnfsky",
  "clfnfsoft",
  "clfnfsonicexe",
  "clfnfsonicexe4",
  "clfnfstarlightmayhem",
  "clfnfstridentcrisis",
  "clfnftailsgetstrolled",
  "clfnftooslowfran",
  "clfnftricky",
  "clfnfundertale",
  "clfnfvoid",
  "clfnfvstabi",
  "clfnfwaltenfiles",
  "clfnfwednesday-infedility",
  "clfnfwhitty",
  "clfnfzardy",
  "clfocus",
  "clfolderdungeon",
  "clfootballbros",
  "clfootballlegends",
  "clforknsausage",
  "clfortzone",
  "clfpa4p1",
  "clfpa4p2",
  "clfreegemas",
  "clfreerider",
  "clfreerider2",
  "clfreerider3",
  "clfridaynightfunkin",
  "clfroggerarcade",
  "clfromrusttoash",
  "clfruitninja",
  "clfunkinmix",
  "clfunnybattle",
  "clfunnybattle2",
  "clfunnymadracing",
  "clfunnyshooter2",
  "clfunnyshooter22",
  "clfuschiax",
  "clfused240",
  "clfzero",
  "clfzerox",
  "clgachaverse",
  "clgalaga",
  "clgameandwatchcollection",
  "clgamewatchgallery3",
  "clgangstabean",
  "clgangstabean2",
  "clgangsterbros",
  "clgarcello",
  "clgarfcaughtinact",
  "clgdlite",
  "clgeneralchaos",
  "clgenericfightermaybe",
  "clgeometrydashscratch",
  "clgeometryvibes",
  "clgeorgeandtheprinter",
  "clgetawayshootout",
  "clgetontop",
  "clgetyoked",
  "clggshinobi",
  "clggshinobi2",
  "clghosttrick",
  "clgimmietheairpod",
  "clgladdihoppers",
  "clglfighters",
  "clgloryhunters",
  "clglover",
  "clgoalsouthafrica",
  "clgobble",
  "clgoingballs",
  "clgolddiggerfrvr",
  "clgoldenaxe",
  "clgoldenaxe2",
  "clgoldenaxe3",
  "clgoldeneye007",
  "clgoldensun",
  "clgoldensunnds",
  "clgoldminer",
  "clgolfbattle",
  "clgolforbit",
  "clgolfsunday",
  "clgoodbigtowertinysquare",
  "clgoodbigtowertinysquare2",
  "clgoodboygalaxy",
  "clgoodmonkeymart",
  "clgooftroopsnes",
  "clgooglebaseball",
  "clgoogledino",
  "clgorescriptclassic",
  "clgorillatag",
  "clgotobed",
  "clgrandactionsimulator-ny",
  "clgranddad",
  "clgrandescapeprison",
  "clgrandtheftautoadvance",
  "clgranny",
  "clgranny2",
  "clgranny22",
  "clgranny3",
  "clgrannycreepy",
  "clgrannynightmare",
  "clgrannyy",
  "clgranturismo",
  "clgranturismo2",
  "clgrassmowing",
  "clgravity",
  "clgravitymod",
  "clgreenergrassawaits",
  "clgrey-box-testing",
  "clgrimacebirthday",
  "clgrindcraft",
  "clgrn",
  "clgrowagarden",
  "clgrowdenio",
  "clgrowmi",
  "clgrowyourgarden",
  "clgta",
  "clgta2",
  "clgta22",
  "clgta2alt",
  "clgtaalt",
  "clgtaalty",
  "clgtachina",
  "clgtamods",
  "clguesstheiranswer",
  "clgun-spin",
  "clgunblood",
  "clguncho",
  "clgunfighterjessejames",
  "clgunknight",
  "clgunmayhem",
  "clgunmayhem2",
  "clgunmayhem2goof",
  "clgunmayhemredux",
  "clgunnight",
  "clgunsmoke",
  "clgunstarheroes",
  "clgymstack",
  "clgyromite",
  "clhacx",
  "clhajimeippo",
  "clhajimenoippo",
  "clhalflife",
  "clhalocombatdevolved",
  "clhandshakes",
  "clhandsofwar",
  "clhandsofwar (1)",
  "clhandsofwar(1)",
  "clhandsofwar(2)",
  "clhandulum",
  "clhanger",
  "clhanger2",
  "clhangonsms",
  "clhappyroom",
  "clhappywheels",
  "clhardwaretycoon",
  "clharmonyofdissonance",
  "clharvestio",
  "clharvestmoon",
  "clharvestmoon2",
  "clharvestmoon64",
  "clhauntedschool",
  "clhauntthehouse",
  "clheartandsoul",
  "clheartandsoul121",
  "clhei$t",
  "clhelixjump",
  "clhellron",
  "clhelpnobrakes",
  "clheretic",
  "clhero3flyingrobot",
  "clherobrinereborn",
  "clhextris",
  "clhighstakes",
  "clhighwayracer2",
  "clhighwaytraffic3d",
  "clhillclimbracinglite",
  "clhipsterkickball",
  "clhit8ox",
  "clhitsinglereal",
  "clhitstunfly",
  "clhl2doom",
  "clhobo",
  "clhobo2",
  "clhobo3",
  "clhobo4",
  "clhobo5",
  "clhobo6",
  "clhobo7",
  "clhobovszombies",
  "clholebattle",
  "clholeio",
  "clhollowknight",
  "clhomesheephome",
  "clhorrormickeymouse",
  "clhotdogbush",
  "clhotwax",
  "clhouseofhazards",
  "clhoverracerdrive",
  "clhuggywuggypixel",
  "clhumanexpenditureprogram",
  "clhungryknight",
  "clhungrylamu",
  "clhyppersandbox",
  "clicantbelievegoogleflaggedmeforthenameofthefilelol",
  "clice age baby",
  "clicedodo",
  "clicefishing",
  "clicypurplehead",
  "clidlebreakout",
  "clidledice",
  "clidlefootballmanager",
  "clidleidlegamedev",
  "clidleminertycoon",
  "clidleminorzamnshes12",
  "climpossiblequiz",
  "climpossiblequiz (1)",
  "climpossiblequiz2",
  "clinclementemerald",
  "clindiantrucksimiulator",
  "clinfinitecraft",
  "clinkgame",
  "clinnkeeper",
  "clinsidestory",
  "clinsomniary",
  "clintellisphere",
  "clinteractivebuddy",
  "clintoruins",
  "clintospace",
  "clintospace2",
  "clintospace3",
  "clintothedeepweb",
  "clintrusion",
  "cliqball",
  "clironsnout",
  "clironsoldier",
  "clirori",
  "clitgetssolonelyhere",
  "cliwbtg",
  "cljacksmith",
  "cljacksmithencryptedorsmthn",
  "cljailbreakobbbobob",
  "cljamesbondjr",
  "cljazzjackrabbit",
  "cljazzjackrabbit2",
  "cljefflings",
  "cljellydadhero",
  "cljellydrift",
  "cljellymario",
  "cljellytruck",
  "cljellytruckgood",
  "cljetforcegemini",
  "cljetpackjoyride",
  "cljetrush",
  "cljetskiracing",
  "cljmocraft",
  "cljohnnytrigger",
  "cljohnnyupgrade",
  "cljojobaps1",
  "cljourneyarcade",
  "cljourneydownhill",
  "cljoustarcade",
  "cljsvecx",
  "cljumbomario",
  "cljumpingshell",
  "cljunglebooksnes",
  "cljungledeerhunting",
  "cljurassicpark",
  "cljustfalllol",
  "cljusthitthebutton",
  "cljustoneboss",
  "clkaizomarioworld",
  "clkalikan",
  "clkanyezone",
  "clkapi",
  "clkaratebros",
  "clkarlson",
  "clkartbros",
  "clkeroseneclient",
  "clkillerinstinct",
  "clkillover",
  "clkilltheiceagebabyadventure",
  "clkimjonguntilepuzzle",
  "clkingdomheartsdays",
  "clkingdomheartsrecoded",
  "clkingdomheartsrecodedalt",
  "clkirby64",
  "clkirby64crystalshards",
  "clkirbyandtheamzingmirror",
  "clkirbycanvascurse",
  "clkirbysadventure",
  "clkirbysdreamland",
  "clkirbysdreamland3",
  "clkirbysoftandwet",
  "clkirbysqueaksquad",
  "clkirbysuperstar",
  "clkirbysuperstarultra",
  "clkirbytiltandtumble",
  "clkittencannon",
  "clklifur",
  "clknifehit",
  "clknightmaretower",
  "clknockknock",
  "clkonkrio",
  "clkoopasrevenge",
  "clkourio",
  "clks2teams",
  "cllaceysflashgames",
  "cllastfirered",
  "cllasthorizon",
  "cllaststand",
  "cllaststand2",
  "clleaderstrike",
  "clleapandavoid2",
  "cllearntofly",
  "cllearntofly2",
  "cllearntofly3",
  "cllearntoflyidle",
  "cllearntoflyidlehack",
  "cllegobatman",
  "cllegobatman2superheroes",
  "cllegoindianajones",
  "cllegoindianajones2",
  "cllegoninjago",
  "cllegostarwars",
  "cllegostarwars2gba",
  "cllegostarwarsgba",
  "cllemmings",
  "clletitconsume",
  "clletsgoeevee",
  "clletsgopikachu",
  "clleveldevil",
  "clleverwarriors",
  "cllightitup",
  "cllilrunmo",
  "cllime",
  "cllinerider",
  "cllinksawakeningdx",
  "cllinktothepast",
  "cllittlealchemy2",
  "cllittlerunmo",
  "cllockthedoor",
  "clloderunner",
  "cllonewolf",
  "cllosangelesshark",
  "cllowknight",
  "clloz1",
  "cllozlinkawakening",
  "cllozminishcap",
  "cllozoracleofseasons",
  "cllozphantomhourglass",
  "cllozspirittracks",
  "cllucid",
  "clluckyblocks",
  "cllumberobby",
  "cllummm",
  "clmadalinstuntcars",
  "clmadalinstuntcarsgood",
  "clmadalinstuntcarsmultiplayerfixed",
  "clmadden93",
  "clmadden94",
  "clmadden95",
  "clmadden96",
  "clmadden99",
  "clmaddenfootball",
  "clmaddenfootball64",
  "clmaddennfl",
  "clmaddennfl2000",
  "clmaddennfl2001",
  "clmaddennfl2002",
  "clmaddy98",
  "clmadness-retaliation",
  "clmadnessaccelerant",
  "clmadnesscombatdefense",
  "clmadnesscombatnexus",
  "clmadnessgemini",
  "clmadnesshydraulic",
  "clmadnessinteractive",
  "clmadnessoffcolor",
  "clmadnesspremediation",
  "clmadnessretaliation",
  "clmadnesss2010",
  "clmadnessstand",
  "clmadskillsmotocross2",
  "clmadstick",
  "clmadstuntcars2",
  "clmagetoweridle",
  "clmagictiles3",
  "clmajorasmask",
  "clmakesureitsclosed",
  "clmami",
  "clmanagod",
  "clmarbleracer",
  "clmarbleracer(1)",
  "clmari0",
  "clmario3",
  "clmario64webgl",
  "clmarioandluigisuperstarsaga",
  "clmariobuilder64",
  "clmariobuilder64(1)",
  "clmariocombat",
  "clmariogolf",
  "clmariokart64",
  "clmariokartds",
  "clmariokartsupercircuit",
  "clmariolostlevels",
  "clmariomadness",
  "clmariomakersnes",
  "clmariominusrabbids",
  "clmariopaint",
  "clmarioparty",
  "clmarioparty2",
  "clmarioparty3",
  "clmariopartyds",
  "clmariosmysterymeat",
  "clmariotennis",
  "clmariotennisgb",
  "clmariovsluigi",
  "clmarvelvsstreetfighterjp",
  "clmaskedforcesunlimited",
  "clmastermindworldconquerer",
  "clmatrixrampage",
  "clmattv2",
  "clmauimallard",
  "clmaxpayne",
  "clmcfpsfbhd",
  "clmcraerally",
  "clmeatboy",
  "clmeatboyflash",
  "clmedalofhonor",
  "clmedievalshark",
  "clmedievil",
  "clmegacd",
  "clmegachess",
  "clmegaclient",
  "clmegaman",
  "clmegaman2",
  "clmegaman2gba",
  "clmegaman3",
  "clmegaman4",
  "clmegaman5",
  "clmegaman5gb",
  "clmegaman6",
  "clmegaman7",
  "clmegaman8",
  "clmegamanbasscftf",
  "clmegamanbattlechipchallenge",
  "clmegamanbn5tc",
  "clmegamanbn5tp",
  "clmegamanbn6cf",
  "clmegamanbn6cg",
  "clmegamanlegends",
  "clmegamanlegends2",
  "clmegamanx",
  "clmegamanx2",
  "clmegamanx3",
  "clmegamanx4",
  "clmegamanx5",
  "clmegamanx6",
  "clmegamanzero",
  "clmegamanzx",
  "clmegaminer",
  "clmelonplayground",
  "clmeowuwu",
  "clmergeroundracers",
  "clmetalgear",
  "clmetalgearsolid",
  "clmetalgearsolidps",
  "clmetalslug",
  "clmetalslug2",
  "clmetalslugadvance",
  "clmetalslugmission1",
  "clmetalslugmission2",
  "clmetroid",
  "clmetroid2",
  "clmetroidfusion",
  "clmetroidprimehunters",
  "clmetroidzeromission",
  "clmiamishark",
  "clmickeymaniasnes",
  "clmicrolife",
  "clmicromages",
  "clmidwaysgreatesthitsn64",
  "clmightyknight",
  "clmightyknight2",
  "clmimic",
  "clmindscape",
  "clmindwave",
  "clminecaves",
  "clminecraft1-8-8",
  "clminecraftcasesim",
  "clminecraftpocketedition",
  "clminecraftshooter",
  "clmineshooter",
  "clminesweeperplus",
  "clminhero",
  "clminicrossword",
  "clminiflips",
  "clminimart",
  "clminishooters",
  "clminitooth",
  "clmiraginewar",
  "clmisslecommand",
  "clmk4ampedup",
  "clmkmythologiesn64",
  "clmktrilogyps1",
  "clmmbn3b",
  "clmmbn3w",
  "clmmbn4bm",
  "clmmbn4rs",
  "clmmbnws",
  "clmmsf2zxn",
  "clmmsf2zxs",
  "clmmsf3ba",
  "clmmsf3rj",
  "clmmsfd",
  "clmmsfl",
  "clmmsfp",
  "clmmwilywars",
  "clmo64",
  "clmo64(1)",
  "clmobcontrolhtml5",
  "clmobiusrevolution",
  "clmomimsleeping",
  "clmomoscrushers",
  "clmoneyrush",
  "clmonkeymart",
  "clmonkeymartenc",
  "clmonsterderby",
  "clmonsterswing",
  "clmonstertracks",
  "clmonstertruckcurfew",
  "clmonstertruckportstunt",
  "clmoonemeraldextremerandomizer",
  "clmortalkombat",
  "clmortalkombat2",
  "clmortalkombat2a",
  "clmortalkombat3",
  "clmortalkombat3a",
  "clmortalkombat4",
  "clmortalkombata",
  "clmortalkombatadvance",
  "clmortkom4",
  "clmotherload",
  "clmotoroadrash",
  "clmotox3m2",
  "clmotox3m3",
  "clmotox3mm",
  "clmotox3mpoolparty",
  "clmotox3mspookyland",
  "clmotox3mwinter",
  "clmountainbikeracer",
  "clmrmine",
  "clmrracer",
  "clmspacman",
  "clmspacman (1)",
  "clmspacman(1)",
  "clmspacman(2)",
  "clmultitask",
  "clmutilate-a-doll",
  "clmvpbaseball",
  "clmxoffroadmaster",
  "clmyfriendpedro",
  "clmyfriendpedroarena",
  "clmyteardrop",
  "cln",
  "clnarc",
  "clnatsuki64",
  "clnaturalselection",
  "clnbajamTE",
  "clnbalive2000",
  "clnbalive2003",
  "clnblox",
  "clneonblaster",
  "clneonrider",
  "clnesworldchampion",
  "clnetattack",
  "clneverendinglegacy",
  "clnewersmbds",
  "clnewgroundsrumble",
  "clnewsupermariobros",
  "clnewyorkshark",
  "clnextdoor",
  "clnflblitz",
  "clnfscarbonowncity",
  "clnfsmostwanted",
  "clnfsporcheunleashed",
  "clnfsunderground",
  "clnfsunderground2",
  "clngon",
  "clngon(1)",
  "clnhl2002",
  "clnhl98",
  "clnhlhitz2003",
  "clnickelodeonsuperbrawl2",
  "clnightcatsurvival",
  "clnightclubshowdown",
  "clnightfire",
  "clnightshade",
  "clnimrods",
  "clninjabrawl",
  "clninjaobbyparkor",
  "clnintendogslab",
  "clnintendoworldcup",
  "clnitclient",
  "clnitromemustdie",
  "clnomoregameasdsadfagfggdfs",
  "clnoobminer",
  "clnotyourpawn",
  "clnovaclient",
  "clnplus",
  "clnsmbuds",
  "clnsmbwds",
  "clnubbysnumberfactory",
  "clnullkevin",
  "clnzp",
  "clobby-99-will-lose",
  "clobby1jumpperclick",
  "clobby456",
  "clobbybike",
  "clobbycart",
  "clobbyonlyup",
  "clobbyrainbowtower",
  "clobbyslide",
  "clobbyswing",
  "clobbyyardsale",
  "clobeythegame",
  "clocarinaoftime",
  "cloddbotout",
  "cloddfuture",
  "clofflineparadise",
  "clohflip",
  "clomegalayers",
  "clomeganuggetclicker",
  "clomnipresent",
  "clonebitadventure",
  "clonenightasfreddy",
  "clonepiece",
  "clonepiecefighting",
  "cloneshotold",
  "clonlyup",
  "cloperius",
  "cloppositeday",
  "clopposumcountry",
  "clorbofcreation",
  "clordinarysonicromhack",
  "cloregontrail",
  "clorigamiking",
  "clormmimastickwithclsoitcanberememberedoyeahclalienhominid",
  "clortalkombat4",
  "closu",
  "clourpleguy",
  "clouthold",
  "cloutnumbered",
  "cloverburden",
  "clovo",
  "clovo2",
  "clovodimensions",
  "clovofixed",
  "clpacman",
  "clpacmana",
  "clpacmansuperfast",
  "clpacmanworld3",
  "clpacmanworldg",
  "clpacmanworldpsx",
  "clpandameic2",
  "clpapabakeria",
  "clpapadonut",
  "clpapalouienighthunt2",
  "clpapalouiewhenburgersattack",
  "clpapalouiewhenpizzasattack",
  "clpapalouiewhensundaesattack",
  "clpapapizzagood",
  "clpapapizzagoody",
  "clpapapizzamamamia",
  "clpapasburgerIIIAAAAA",
  "clpapascheeseria",
  "clpapascupcakeria",
  "clpapasfreezeria",
  "clpapashotdoggeria",
  "clpapaspancakeria",
  "clpapaspastaria",
  "clpapasscooperia",
  "clpapassushiria",
  "clpapastacomia",
  "clpapaswingeria",
  "clpaperio",
  "clpaperio3d",
  "clpaperiomania",
  "clpapermario",
  "clpapermariopromode",
  "clpapermariottyd",
  "clparappatherapper",
  "clparappatherapperalt",
  "clparkingfury",
  "clparkingfury2",
  "clparkingfury3",
  "clparkingrush",
  "clpartnersintime",
  "clpeacekeeper",
  "clpeach",
  "clpeggle",
  "clpenaltykicks",
  "clpenguindiner",
  "clpenguinpass",
  "clpepsiman",
  "clpepsimanalt",
  "clpereelous",
  "clperfectdark",
  "clperfecthotel",
  "clpersona",
  "clpersona2",
  "clpersona2alt",
  "clpersonaalt",
  "clpetworld",
  "clphantasystar",
  "clphantasystar2",
  "clphantasystar3",
  "clphantasystar4",
  "clphasma",
  "clpheonixjusticeforall",
  "clpheonixrightaceattorny",
  "clpheonixtrialsandyear",
  "clpheonixtrialsandyeartrhfasd",
  "clpibbyapocalypse",
  "clpiclient",
  "clpico8",
  "clpico8edu",
  "clpicodriller",
  "clpicohot",
  "clpicolife",
  "clpiconightpunkin",
  "clpicosschool",
  "clpicovsbeardx",
  "clpiecesofcake",
  "clpikwip",
  "clpingpongchaos",
  "clpinkbike",
  "clpint",
  "clpitfall",
  "clpitof100trials",
  "clpixelbattlegroundsio",
  "clpixelcombat2",
  "clpixelgun",
  "clpixelquestlostidols",
  "clpixelshooter",
  "clpixelspeedrun",
  "clpixelwarfare",
  "clpizzapapa",
  "clpizzatower",
  "clpkmnarutoans",
  "clplanetlife",
  "clplangman",
  "clplantsvszombies",
  "clplantsvszombiesnds",
  "clplazmaburst",
  "clplinko",
  "clplonky",
  "clpogo3D",
  "clpokeacademylifeforever",
  "clpokeallin",
  "clpokebattlefact",
  "clpokeblack",
  "clpokeblack2alt",
  "clpokeblack2html",
  "clpokeblackalt",
  "clpokeblazeblack2redux",
  "clpokeblue",
  "clpokeclassic",
  "clpokecrown",
  "clpokecrystaladvanceredux",
  "clpokecrystalclear",
  "clpokediamond",
  "clpokedreamstone",
  "clpokeeliteredux",
  "clpokeelysiuma",
  "clpokeelysiumb",
  "clpokeemeraldenhanced",
  "clpokeemeraldexceeded",
  "clpokeemeraldhorizons",
  "clpokeemeraldimperium",
  "clpokeemeraldrandom",
  "clpokeemeraldrogue",
  "clpokeemeraldz",
  "clpokefiregold",
  "clpokeflora",
  "clpokefrlgplus",
  "clpokefuseddimension",
  "clpokegaia",
  "clpokegoldenshield",
  "clpokegschronicles",
  "clpokeheartgold",
  "clpokelightplatinum",
  "clpokeliquidcrysta",
  "clpokemegamoemon",
  "clpokemonamnesia",
  "clpokemonclover",
  "clpokemoncrystal",
  "clpokemonemerald",
  "clpokemonemeraldcrest",
  "clpokemonemeraldimperium",
  "clpokemonemeraldkaizo",
  "clpokemonemeraldmini",
  "clpokemonemeraldseaglass",
  "clpokemonenergizedemerald",
  "clpokemonevolvedsfdgsdfs",
  "clpokemonfirered",
  "clpokemonfireredandleafgreenplusedition",
  "clpokemonfireredrandomized",
  "clpokemongold",
  "clpokemonkaizoironfirered",
  "clpokemonlazarus",
  "clpokemonleafgreen",
  "clpokemonmodernemerald",
  "clpokemonmysterydungeon",
  "clpokemonperfectemerald55",
  "clpokemonquetzal",
  "clpokemonroaringred",
  "clpokemonruby",
  "clpokemonsaiph",
  "clpokemonsaiph2",
  "clpokemonsapphire",
  "clpokemonshinsigma",
  "clpokemonsilver",
  "clpokemonslgreen",
  "clpokemonsmred",
  "clpokemonsnap",
  "clpokemonsors",
  "clpokemonsors2",
  "clpokemonstadium",
  "clpokemonstadium2",
  "clpokemontowerdefense",
  "clpokemonultimatefusion",
  "clpokemonunbound",
  "clpokemonvolume1",
  "clpokemonvolume2",
  "clpokemonvolume3",
  "clpokemonvolume4",
  "clpokemoonemerald",
  "clpokemoongalaxy",
  "clpokemysteryexplorersofsky",
  "clpokenameless",
  "clpokeodyssey",
  "clpokepasta",
  "clpokepath",
  "clpokepearl",
  "clpokeperfectfirered",
  "clpokepisces",
  "clpokeplatinum",
  "clpokeplatinumrandomized",
  "clpokepureblue",
  "clpokepuregreen",
  "clpokepurered",
  "clpokerechargedpink",
  "clpokerechargedyellow",
  "clpokerecordkeepers",
  "clpokered",
  "clpokerenegadeplat",
  "clpokerocketedition",
  "clpokerowe",
  "clpokeruby",
  "clpokerunandbun",
  "clpokescorchedsilver",
  "clpokesoulsilver",
  "clpokesunsky",
  "clpoketcg1",
  "clpoketcg2",
  "clpokethepit",
  "clpoketoomanytypes2",
  "clpoketourmaline",
  "clpokeultraviolet",
  "clpokeunovaemerald",
  "clpokevega",
  "clpokevoltwhite2redux",
  "clpokevoyager",
  "clpokewhite",
  "clpokewhite2",
  "clpokewhite2alt",
  "clpokeyellow",
  "clpolicepursuit2",
  "clpolishedcrystal",
  "clpolytrackbutnotflagged",
  "clpolytrackbutnotflagged(1)",
  "clpolytrackworksnow",
  "clpomgetsinternet",
  "clpoorbunny",
  "clpopeyepapi",
  "clporklike",
  "clportal",
  "clportal2d",
  "clportaldefendersTD",
  "clportaldefendersfastbreak",
  "clportalflash",
  "clporter",
  "clportraitofruin",
  "clpossessquest",
  "clpostal",
  "clpotatomanseeksthetroof",
  "clpou",
  "clpou(1)",
  "clpowerslave",
  "clpraxisfighterx",
  "clprebronzeage",
  "clprecivilationbronzeage",
  "clprehistoricshark",
  "clprimary",
  "clprismarine",
  "clprocessortycoon",
  "clprofessorlaytonandthecuriousvillage",
  "clpuckman",
  "clpullfrog",
  "clpumpkinrun",
  "clpunchout",
  "clpunchthedrump",
  "clpunchthetrump",
  "clpuppethockey",
  "clpuppetmaster",
  "clpushyourluck",
  "clpuyopuyofever",
  "clpvz",
  "clpvz2",
  "clpvz2gardenless",
  "clpyrotoad",
  "clqbert",
  "clqbertarcade",
  "clqtrewired",
  "clquake2",
  "clquake3",
  "clquake64",
  "clquickieworld",
  "clqwop",
  "clracemaster3d",
  "clracingarena",
  "clradicalred",
  "clradracer",
  "clraftwars",
  "clraftwars2",
  "clragdoll-io",
  "clragdollachivement",
  "clragdollarchers",
  "clragdolldrop",
  "clragdollhit",
  "clragdollrunners",
  "clragdollsoccer",
  "clragollhit",
  "clrainbowsix",
  "clrainbowsixalt",
  "clraldiscrackhouse",
  "clravenbase",
  "clray1",
  "clray2",
  "clrayman",
  "clraze",
  "clraze2",
  "clraze3",
  "clre3",
  "clreachthecore",
  "clrealflightsim",
  "clrebuild",
  "clrebuild2",
  "clrecoil",
  "clredalert",
  "clredball",
  "clredball2",
  "clredball3",
  "clredball4",
  "clredball4(1)",
  "clredball4vol2",
  "clredball4vol3",
  "clredhanded",
  "clredtierunner",
  "clredvbluefix",
  "clredvsblue2",
  "clredvsbluewar",
  "clreignofcentipede",
  "clrenegades",
  "clrepobad",
  "clresidentevil",
  "clresidentevil2",
  "clresidentevil2d1",
  "clresidentevil2d2",
  "clresizer",
  "clresortempire",
  "clretrobowl",
  "clretrobowlcollege",
  "clretrohighway",
  "clretropingpong",
  "clreturnman",
  "clreturnman2",
  "clreturntoriddleschool",
  "clrevolutionidle",
  "clrewrite2",
  "clrh",
  "clrhythmheaven",
  "clrhythymymheaven",
  "clricochetkills2",
  "clriddle",
  "clriddlemiddleschool",
  "clriddleschool",
  "clriddleschool2",
  "clriddleschool3",
  "clriddleschool445544444$$444$444",
  "clriddletransfer",
  "clriddletransfer2",
  "clriddleuneversityfix",
  "clridgeracer",
  "clrisehigher",
  "clristar",
  "clroadfighter",
  "clroadoffury",
  "clroadofthedead",
  "clroadofthedead2",
  "clroadrunnernes",
  "clrocketgoalio",
  "clrocketjump",
  "clrocketknight2",
  "clrocketknight2 (1)",
  "clrocketknight2(1)",
  "clrocketknight2(2)",
  "clrocketknightadventures",
  "clrocketleague",
  "clrocketpult",
  "clrocketsoccerderby",
  "clrodha",
  "clroguesoul",
  "clroguesoul2",
  "clrollerballer",
  "clrollingsky",
  "clrollyvortex",
  "clrolypolymonster",
  "clrooftoprun",
  "clrooftopsnipers",
  "clrooftopsnipers2",
  "clroomclicker",
  "clrosegold",
  "clrotate",
  "clroulettehero",
  "clrouletteknight",
  "clruffle",
  "clrun",
  "clrun-2",
  "clrun2",
  "clrun3",
  "clrunningfred",
  "clrussianbuckshot",
  "clrussiancardriver",
  "clrussiansandbox",
  "clsaihatestation",
  "clsandboxcity",
  "clsandboxels",
  "clsandsofthecoliseum",
  "clsandstone",
  "clsandstone(1)",
  "clsandtris",
  "clsantarun",
  "clsanty",
  "clsaszombieassault2",
  "clsatryn",
  "clsaulgoodmanrun",
  "clsausageflip",
  "clsayorisnotebook",
  "clscalethedepths",
  "clscarletandviolet",
  "clscarletshift",
  "clscarymazegame",
  "clscaryshawarma",
  "clscaryteacher3d",
  "clschoolboyrunaway",
  "clscrapmetal3",
  "clscrapyarddog",
  "clscratchoptions",
  "clscribblenauts",
  "clscubabear",
  "clsd-thewar",
  "clsdf",
  "clseamongrel",
  "clsecretofmana",
  "clsega2gg",
  "clself",
  "clsentryfortress",
  "clserenitrove",
  "clserioussamadvance",
  "clservingupmadness",
  "clsevendays",
  "clsfk",
  "clsfk2",
  "clsfklaststand",
  "clsfkleague",
  "clshadowcourier",
  "clshadowdancer",
  "clshadowdancersecret",
  "clshaggy",
  "clshaggy (1)",
  "clshantaegb",
  "clshapetransform",
  "clshc1",
  "clshc2",
  "clshc3",
  "clshift",
  "clshift2",
  "clshift3",
  "clshiftatmidnight",
  "clshinmegamitenseidevilsurvivor",
  "clshinobi",
  "clshinobi3",
  "clshinobirevenge",
  "clshoppingcarthero",
  "clshortlife",
  "clshotout4",
  "clshredmill",
  "clshredsauce",
  "clshrek-2",
  "clshrubnaut",
  "clshwultimatem",
  "clsideeffects",
  "clsidepocket",
  "clsierra7",
  "clsilenthill",
  "clsilenthillalt",
  "clsilk",
  "clsilkmelody",
  "clsiloshowdow",
  "clsilver",
  "clsimcity64",
  "clsimpsonsarcade",
  "clsixwaystodie",
  "clskateit",
  "clskateordie",
  "clskibididibidygyattohiorizzingallovertheplacestillwatermangotheoryfemboydrool",
  "clskibidiinthebackrooms",
  "clskibidishooter",
  "clskinwalker",
  "clskong",
  "clskyrace-3d",
  "clskywire",
  "clskywire2",
  "clslenderman",
  "clslendytubbies",
  "clsliceitall",
  "clslideinthewoods",
  "clslimelabratory",
  "clslipways",
  "clslitherio",
  "clslope",
  "clslope2player",
  "clslope3",
  "clslopeplus",
  "clslotornot",
  "clslowroads",
  "clsm63redux",
  "clsm64greenstars",
  "clsm64hiddenstars",
  "clsm64lastimpact",
  "clsm64liminaldream",
  "clsm64oot",
  "clsm64sapphire",
  "clsmadvance2",
  "clsmadvance3",
  "clsmashkarts",
  "clsmashkartsworking",
  "clsmashremix",
  "clsmashremix201",
  "clsmb12",
  "clsmbc",
  "clsmbcrossover",
  "clsmbgameover",
  "clsmbremastered",
  "clsmc",
  "clsmgds",
  "clsnailbob",
  "clsnailbob2",
  "clsnailbob3",
  "clsnailbob4space",
  "clsnailbob5lovestory",
  "clsnakeis",
  "clsnakelike",
  "clsnipershot",
  "clsniperv2",
  "clsnowballio",
  "clsnowboardobby",
  "clsnowbros",
  "clsnowbros (1)",
  "clsnowbros(1)",
  "clsnowbros(2)",
  "clsnowbrothers",
  "clsnowdrift",
  "clsnowrid",
  "clsnowrideee",
  "clsnowrider",
  "clsnowridergoodygumdrops",
  "clsnowriderrrr",
  "clsnowroad",
  "clsnowwhite",
  "clsoccerbros",
  "clsoccerrandom",
  "clsoccerrandomgood",
  "clsodasimulator",
  "clsolarsandbox",
  "clsolarsmash",
  "clsolatrobo",
  "clsolitaire",
  "clsolstice",
  "clsomari64",
  "clsonic1contemporary",
  "clsonic1mobile",
  "clsonic2mobile",
  "clsonic2pinkedition",
  "clsonic2timeandplace",
  "clsonic3andknuckles",
  "clsonic3andsally",
  "clsonic3complete",
  "clsonic3dblast",
  "clsonic3dblastdx",
  "clsonicadvance",
  "clsonicadvance2",
  "clsonicadvance2sp",
  "clsonicadvance3",
  "clsonicandashuro",
  "clsonicandfallingstar",
  "clsonicandknuckles",
  "clsonicbattle",
  "clsonicblast",
  "clsoniccd",
  "clsoniccdmobile",
  "clsonicchaos",
  "clsonicclassiccollection",
  "clsonicclassicheroes",
  "clsonicclassicheroes(1)",
  "clsoniccolors",
  "clsonicdeltaorigins",
  "clsoniceexeog",
  "clsonicerazor",
  "clsonicgg",
  "clsonicinsmw(2)",
  "clsonicjam",
  "clsoniclabyrinth",
  "clsonicmania",
  "clsonicmaniaplus",
  "clsonicmegamix",
  "clsonicmon",
  "clsonicpocketadventure",
  "clsonicr",
  "clsonicralt",
  "clsonicrevert",
  "clsonicrush",
  "clsonicrushadventure",
  "clsonicscorchedquest",
  "clsonicspinball",
  "clsonicthehedgehog",
  "clsonicthehedgehog2",
  "clsonicthehedgehog3",
  "clsonny2",
  "clsortthecourt",
  "clsotn",
  "clsouljumper",
  "clsoundboard",
  "clsouthparkn64",
  "clspacebarclicker",
  "clspacecompany",
  "clspaceharriersms",
  "clspaceinvade95",
  "clspaceinvaders",
  "clspaceiskey",
  "clspaceiskey2",
  "clspaceiskeyxmas",
  "clspacewarsbattleground",
  "clspacewaves",
  "clspecialmission",
  "clspeedperclick",
  "clspeedstars",
  "clspelunky",
  "clspewer",
  "clspidermanps1",
  "clspiralroll",
  "clspiritsofhell",
  "clsprinter",
  "clsprunked",
  "clsprunki",
  "clsprunkiclicker",
  "clspyhunter",
  "clsquidplayground",
  "clstackballio",
  "clstacktris",
  "clstackydash",
  "clstarfox",
  "clstarfox64",
  "clstarraiders",
  "clstateio",
  "clstation141",
  "clstationmeltdown",
  "clstationsaturn",
  "clsteakandjake",
  "clstealbrainrot",
  "clstealbrainrotonline",
  "clstealthassassin",
  "clstealthmaster",
  "clsteelempire",
  "clsteelsurge",
  "clsteepdescent",
  "clstickarchersbattle",
  "clstickdefenders",
  "clstickfighter",
  "clstickjetchallenge",
  "clstickmanandguns",
  "clstickmanclash",
  "clstickmanduel",
  "clstickmangtacity",
  "clstickmanhook",
  "clstickmankombat2d",
  "clstickmanstealingdiamond",
  "clstickmerge",
  "clstickminairship",
  "clstickminbreakingbank",
  "clstickminescapingprison",
  "clstickminfleecomplex",
  "clstickrpgcomplete",
  "clstickslasher",
  "clstickwar",
  "clstickwar2",
  "clstickwithit",
  "clstormthehouse",
  "clstormthehouse2",
  "clstormthehouse3",
  "clstrangejournet",
  "clstreangeropepolice",
  "clstreetfighter2",
  "clstreetfighter2turbo",
  "clstreetfighteralpha3",
  "clstreetfighterumuhsomething",
  "clstreetofrage",
  "clstreetofrage2",
  "clstreetofrage3",
  "clstrikeforceheroes",
  "clstrikeforceheroes2",
  "clstrikeforceheroes3",
  "clstrikerdummies",
  "clstylesavvy",
  "clsubwaysurfersbarcelona",
  "clsubwaysurfersbeijing",
  "clsubwaysurfersberlin",
  "clsubwaysurfersbuenosaires",
  "clsubwaysurfershavana",
  "clsubwaysurfershouston",
  "clsubwaysurfersiceland",
  "clsubwaysurferslondon",
  "clsubwaysurfersmexico",
  "clsubwaysurfersmiami",
  "clsubwaysurfersmonaco",
  "clsubwaysurfersneworeleans",
  "clsubwaysurfersneworleans",
  "clsubwaysurferssanfrancisco",
  "clsubwaysurferssanfrancisco (1)",
  "clsubwaysurferssanfrancisco(1)",
  "clsubwaysurfersstpetersburg",
  "clsubwaysurferswinterholiday",
  "clsubwaysurferszurich",
  "clsugarsugar",
  "clsuika",
  "clsuikapico",
  "clsummerrider",
  "clsunandmoon",
  "clsuperbomberman",
  "clsuperbomberman2",
  "clsuperbomberman3",
  "clsuperbomberman4",
  "clsuperbomberman5",
  "clsuperc",
  "clsupercarrush",
  "clsupercastlevaniaVI",
  "clsuperchibiknight",
  "clsupercold",
  "clsuperdarkdeception",
  "clsuperdiagonalmario2",
  "clsuperdromebugs",
  "clsuperdromebugs(1)",
  "clsuperfallingfred",
  "clsuperfighters",
  "clsuperhot",
  "clsuperhotlinemiami",
  "clsuperhouseofdeadninjas",
  "clsuperislandadventure",
  "clsuperliquidsoccer",
  "clsupermario",
  "clsupermario3mix",
  "clsupermario63",
  "clsupermario64",
  "clsupermario64ds",
  "clsupermario74",
  "clsupermarioallstars",
  "clsupermariobros",
  "clsupermariobros2",
  "clsupermariobros2us",
  "clsupermariobros3",
  "clsupermariobros3real",
  "clsupermariokart",
  "clsupermarioland",
  "clsupermarioland2",
  "clsupermarioland2dx",
  "clsupermariolanddx",
  "clsupermariomon",
  "clsupermariorpg",
  "clsupermariostarroad",
  "clsupermariostarroadretooled",
  "clsupermariosunshine64",
  "clsupermarioworld",
  "clsupermarioworld2",
  "clsupermetroid",
  "clsupermonkeyballjr",
  "clsupernoahsark3D",
  "clsuperoliverworld",
  "clsuperonionboy2",
  "clsuperpickleballadventure",
  "clsuperpunchout",
  "clsuperpuzzlefighter2turbo",
  "clsuperpuzzlefighter2turboalt",
  "clsupersantakicker",
  "clsupersantakicker2",
  "clsuperscribblenauts",
  "clsupersmashbros",
  "clsupersmashflash",
  "clsupersmashflash08",
  "clsupersmashflash2",
  "clsupersmashflash2butdifversion",
  "clsuperstreetfighter2turbojp",
  "clsupertiltbros",
  "clsupitdept",
  "clsupremeduelist",
  "clsurvivalracev2",
  "clsurvivorio",
  "clsushicat",
  "clsushicat2",
  "clsushiunroll",
  "clswerve",
  "clswitchblade",
  "clswordandshieldultimateplus",
  "clswordfight",
  "clswordplay",
  "clswordsandsandals",
  "clswordsandsandals2",
  "clswordsandsouls",
  "clsydneyshark",
  "cltabi",
  "cltabletanks",
  "cltabletennisworldtour",
  "cltacostand",
  "cltag-",
  "cltagc3",
  "cltagcm",
  "cltailofthedragon",
  "cltaisei",
  "cltakeover",
  "cltallio",
  "cltallmanrun",
  "cltankmayhem",
  "cltankpixel",
  "cltanktrouble",
  "cltanukisunset",
  "cltanukisunsetuhhhhhhhh",
  "cltapper",
  "cltaproad",
  "cltastyplanet",
  "cltboidemo",
  "cltboilambeternal",
  "cltecmobowl",
  "cltekken2ps1",
  "cltekken3ps1",
  "cltelephonetrouble",
  "cltelocation",
  "cltempest2000",
  "cltempleofboom",
  "cltemplerun2",
  "cltempoverdose",
  "clteod",
  "clterra",
  "clterritorialio",
  "clterritorywar",
  "clterritorywar2",
  "clterritorywar3",
  "cltetris",
  "cltetrisattack",
  "cltetrisgba",
  "cltetrisgrandmaster2",
  "clthanksforremindingmeihadtofixthis",
  "cltheclassroom",
  "cltheclassroom2",
  "cltheclassroom3",
  "clthedeadseat",
  "clthedeepestsleep",
  "clthedude",
  "cltheenchantedcave2",
  "cltheimpossiblegame",
  "cltheincrediblemachine",
  "clthelaststand",
  "clthelaststandunioncity",
  "clthelaststandunioncity (1)",
  "clthemaninthewindow",
  "clthemepark",
  "clthepit",
  "clthereisnofile",
  "clthermomorph",
  "clthesodorrace",
  "cltheyarecoming",
  "clthisistheonlylevel",
  "clthisistheonlylevel2",
  "clthisistheonlyleveltoo",
  "clthreegoblets",
  "clthrowapotato",
  "clthrowapotatoagain",
  "clthwack",
  "cltiberiandawn",
  "cltimeshooter2",
  "cltimeshooter3",
  "cltimewarriors",
  "cltinyfishing",
  "cltmnt",
  "cltmnt2arc",
  "cltmntarc",
  "cltmntturtlesintime",
  "cltoastarling",
  "cltoasterball",
  "cltoejam&earl",
  "cltoejam&earlpof",
  "cltombofthemass",
  "cltommorowandyesterday",
  "cltomodachicollection",
  "cltonyhawkskater2",
  "cltonyhawkskater4",
  "cltonyhawksunderground",
  "cltoomanytypes",
  "cltopspeedracing3d",
  "cltosstheturtle",
  "cltotm",
  "cltouhou",
  "cltouhou2",
  "cltouhou3",
  "cltouhou4",
  "cltouhou5",
  "cltowerblocks",
  "cltowercrash3d",
  "cltowerwizard",
  "cltownscraper",
  "cltrace",
  "cltrafficjam3d",
  "cltralalerotralalaescapetungtungtungsahur",
  "cltrappedwithjester",
  "cltrapthecat",
  "cltrechoroustrials",
  "cltrechoroustrialspart2",
  "cltriachnid",
  "cltripleplay2000",
  "cltriviacrack",
  "cltrollfacequest1",
  "cltrollfacequest10",
  "cltrollfacequest11",
  "cltrollfacequest12",
  "cltrollfacequest13",
  "cltrollfacequest2",
  "cltrollfacequest3",
  "cltrollfacequest4",
  "cltrollfacequest5",
  "cltrollfacequest6",
  "cltrollfacequest7",
  "cltrollfacequest8",
  "cltrollfacequest9",
  "cltrucksim",
  "cltsuzukimaze",
  "cltubejumpers",
  "cltungtunghorror",
  "cltungtungtungsahurobby",
  "cltunnelrush",
  "cltunnelrushbetter",
  "cltupertariotros",
  "clturbostars",
  "clturokdinosaurhunter",
  "cltwinshot",
  "cltwinshot (1)",
  "cltwinshot(1)",
  "cltwistedmetal",
  "cltwistedmetal2",
  "cltwoball3d",
  "clucds",
  "cluckyblockobbyEUOPHRATESRIVER",
  "clufoswampoddysey",
  "clultima",
  "clultimateassassian2",
  "clultimateassassian3",
  "clultimatemortalkombat",
  "clultimatemortalkombat3",
  "clultrakill",
  "clumjammerlammy",
  "clumstickmangameidkiforgor",
  "cluncannycatgolf",
  "clunderneath",
  "clundertalelb",
  "clundertaler",
  "clundertaleyellow",
  "clunfairmario",
  "clunfairmarioworkquestionmark",
  "clunfairundyne",
  "clunicyclehero",
  "clunitresdreams",
  "cluno",
  "clunownking",
  "cluntime",
  "cluntitledgoosegame",
  "clupgradecomplete",
  "clupgradecomplete2",
  "clupslash",
  "clusterrush",
  "clvampiresurvivors",
  "clvanguard",
  "clvaportrails",
  "clvex",
  "clvex2",
  "clvex3",
  "clvex3xmas",
  "clvex4",
  "clvex5",
  "clvex6",
  "clvex7",
  "clvex8",
  "clvexchallenges",
  "clvexx3m",
  "clvexx3m2",
  "clvillager",
  "clvincentmansionofthedead",
  "clvisitor",
  "clvolleyrandom",
  "clvollyballchallenge",
  "clvortex",
  "clvsagore",
  "clvsnonsense",
  "clvvvvvv",
  "clvvvvvv(1)",
  "clwaluigitacostand",
  "clwarfare1917",
  "clwarfare1944",
  "clwarioland1",
  "clwarioland3",
  "clwarioland4",
  "clwariowarediy",
  "clwariowareinc",
  "clwartheknight",
  "clwaterpoolio",
  "clwaterworks",
  "clwavedash",
  "clwaverace64",
  "clwaverun",
  "clwebecomewhatwebehold",
  "clwebfishing",
  "clweltling",
  "clwermhole",
  "clwhackthetheif",
  "clwhackyourboss",
  "clwhackyourcomputer",
  "clwhatamarioworld",
  "clwheeliebike",
  "clwheely",
  "clwheely2",
  "clwheely3",
  "clwheely4",
  "clwheely5",
  "clwheely6",
  "clwheely7",
  "clwheely8",
  "clwilywars",
  "clwindowsdoors",
  "clwinterfalling",
  "clwinterolympics",
  "clwipeout2097",
  "clwipeout2097alt",
  "clwitchcrafttd",
  "clwolfchild",
  "clwolfenstein",
  "clwolfenstein3d",
  "clwoodworm",
  "clwordle",
  "clworldcup98",
  "clworldshardestgame",
  "clworldshardestgame2",
  "clworldshardestgame3",
  "clworldshardestgame4",
  "clwpnfire",
  "clwrassling",
  "clwrestlebros",
  "clwwfattitude",
  "clwwfsmackdown2",
  "clxevent",
  "clxmenarcade",
  "clyanderesimulator",
  "clyarsrevenge",
  "clyellow",
  "clyohohoio",
  "clyouarelucky",
  "clyourturntodie",
  "clyouvs100skibidi",
  "clyumenikki",
  "clzdoom",
  "clzelda2thelegendoflink",
  "clzeldaminishcap",
  "clzenword",
  "clzoinkz",
  "clzombieexploder",
  "clzombieroad",
  "clzombierush",
  "clzombiesatemyneighboors",
  "clzombopaclypse2",
  "clzombotron",
  "clzombotron2",
  "clzombotronreboot",
  "clzrist",
  "clzuma",
  "clzumashooter",
  "clÖoo",
  "clʘ"
];
/* =====================================================
   FAVOURITES
===================================================== */
function getFavs() {
  try { return JSON.parse(localStorage.getItem('gameFavs') || '[]'); } catch(e) { return []; }
}
function saveFavs(arr) {
  localStorage.setItem('gameFavs', JSON.stringify(arr));
}
function isFav(file) { return getFavs().includes(file); }
function toggleFav(file) {
  let favs = getFavs();
  if (favs.includes(file)) favs = favs.filter(f => f !== file);
  else favs.push(file);
  saveFavs(favs);
  renderFavsSection();
  // update any star button for this file across the page
  document.querySelectorAll(`.star-btn[data-file="${CSS.escape(file)}"]`).forEach(b => {
    b.textContent = isFav(file) ? '★' : '☆';
    b.classList.toggle('starred', isFav(file));
  });
}

function buildGameClickHandler(file) {
  return () => {
    const name = file.includes('.') && file.lastIndexOf('.') > 0 ? file : file + '.html';
    // Launch animation overlay
    let loader = document.getElementById('game-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'game-loader';
      loader.innerHTML = `<div class="launch-icon">🎮</div><div class="loading-spinner"></div><div class="loading-text">Launching...</div>`;
      document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => loader.classList.add('visible')));
    const hide = (msg) => {
      loader.classList.remove('visible');
      setTimeout(() => {
        loader.style.display = 'none';
        if (msg) { const t = document.createElement('div'); t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(239,68,68,.9);color:#fff;padding:10px 20px;border-radius:10px;font-family:Outfit,sans-serif;font-size:13px;z-index:999999;'; t.textContent = msg; document.body.appendChild(t); setTimeout(()=>t.remove(),4000); }
      }, 350);
    };
    // 15s timeout — avoids hanging loader if CDN is slow
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 15000);
    const gameUrl = `https://google-drive-hub.pages.dev/${encodeURIComponent(name)}`;
    fetch(gameUrl, { signal: ctrl.signal })
      .then(r => { clearTimeout(tid); if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(text => {
        hide();
        const base = `https://google-drive-hub.pages.dev/`;
        const proxy = `https://broad-truth-d488.liamkurylak.workers.dev`;

        // Rewrite all cdn.jsdelivr.net references to go through our Cloudflare Worker proxy
        text = text.replace(/https?:\/\/cdn\.jsdelivr\.net/g, proxy);

        const isUnity = /UnityLoader|unity\.js|UnityProgress|\.unityweb|\.data\.gz/i.test(text);
        const w = window.open('about:blank', '_blank');
        if (!w) return;
        if (isUnity) {
          if (!/<base\s/i.test(text)) {
            text = text.replace(/(<head[^>]*>)/i, `$1<base href="${base}">`);
            if (!/<head/i.test(text)) text = `<base href="${base}">` + text;
          }
          w.document.open(); w.document.write(text); w.document.close();
        } else {
          if (!/<base\s/i.test(text)) {
            text = text.replace(/(<head[^>]*>)/i, `$1<base href="${base}">`);
            if (!/<head/i.test(text)) text = `<base href="${base}">` + text;
          }
          w.document.open(); w.document.write(text); w.document.close();
        }
      })
      .catch(e => { clearTimeout(tid); hide(e.name === 'AbortError' ? 'Game took too long to load — try again.' : 'Failed to load game. Check your connection.'); });
  };
}

function renderFavsSection() {
  const container = document.getElementById('sections-container');
  let section = document.getElementById('section-FAVS');
  const favs = getFavs();

  if (!favs.length) {
    if (section) section.remove();
    return;
  }

  if (!section) {
    section = document.createElement('div');
    section.className = 'letter-section';
    section.id = 'section-FAVS';
    container.insertBefore(section, container.firstChild);
  }
  section.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'letter-header';
  header.innerHTML = '<span style="color:#facc15;text-shadow:0 0 12px rgba(250,204,21,0.5);">★</span> Favorites <span class="section-count">' + favs.length + '</span>';
  header.style.cursor = 'pointer';
  header.title = 'Click to collapse';
  const grid = document.createElement('div');
  grid.className = 'buttons-container';

  header.onclick = () => {
    const isCollapsed = grid.classList.toggle('collapsed');
    header.style.opacity = isCollapsed ? '0.5' : '1';
  };

  favs.forEach(file => {
    const btn = document.createElement('input');
    btn.type = 'button';
    btn.value = file;
    btn.onclick = buildGameClickHandler(file);
    grid.appendChild(btn);
  });

  section.appendChild(header);
  section.appendChild(grid);

  // transform new buttons into cards
  grid.querySelectorAll('input[type="button"]').forEach(btn => transformButtonToCard(btn));
}

/* =====================================================
   SECTION BUILDER
===================================================== */
function generateAllSections() {

  const allChars = ['0','1','2','3','4','5','6','7','8','9',
    'A','B','C','D','E','F','G','H','I','J','K','L','M',
    'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

  const filesByChar = {};
  allChars.forEach(c => { filesByChar[c] = []; });

  files.forEach(file => {
    const lower = file.toLowerCase();
    if (lower.startsWith('cl')) {
      const aftercl = lower.substring(2);
      if (aftercl.length > 0) {
        const fc = aftercl[0].toUpperCase();
        if (filesByChar[fc]) filesByChar[fc].push(file);
      }
    }
  });

  const container = document.getElementById('sections-container');

  allChars.forEach(char => {
    if (filesByChar[char].length === 0) return;

    const section = document.createElement('div');
    section.className = 'letter-section';
    section.id = `section-${char}`;

    const header = document.createElement('div');
    header.className = 'letter-header';
    header.style.cursor = 'pointer';
    header.title = 'Click to collapse';

    const countBadge = document.createElement('span');
    countBadge.className = 'section-count';
    countBadge.dataset.total = filesByChar[char].length;
    countBadge.textContent = filesByChar[char].length;

    const chevron = document.createElement('span');
    chevron.textContent = '▾';
    chevron.style.cssText = 'margin-left:auto;font-size:0.9rem;opacity:0.4;display:inline-block;transition:transform 0.25s ease;';

    header.appendChild(document.createTextNode(char + ' '));
    header.appendChild(countBadge);
    header.appendChild(chevron);

    const grid = document.createElement('div');
    grid.className = 'buttons-container';

    let collapsed = false;
    header.onclick = () => {
      collapsed = !collapsed;
      grid.classList.toggle('collapsed', collapsed);
      header.style.opacity = collapsed ? '0.5' : '1';
      chevron.style.transform = collapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
    };

    // Show skeletons immediately while real cards build
    const skCount = Math.min(filesByChar[char].length, 10);
    for (let i = 0; i < skCount; i++) {
      const sk = document.createElement('div');
      sk.className = 'game-card-skeleton';
      sk.innerHTML = '<div class="skeleton-thumb"></div><div class="skeleton-lines"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>';
      grid.appendChild(sk);
    }

    section.appendChild(header);
    section.appendChild(grid);
    container.appendChild(section);

    // Replace skeletons with real cards in idle-time chunks (keeps UI responsive)
    const delay = allChars.indexOf(char) * 25;
    setTimeout(() => {
      const btnList = filesByChar[char].map(file => {
        const btn = document.createElement('input');
        btn.type = 'button';
        btn.value = file;
        btn.onclick = buildGameClickHandler(file);
        return btn;
      });
      const CHUNK = 25;
      let idx = 0;
      function renderChunk() {
        const end = Math.min(idx + CHUNK, btnList.length);
        if (idx === 0) grid.innerHTML = ''; // clear skeletons on first chunk
        const frag = document.createDocumentFragment();
        for (; idx < end; idx++) {
          frag.appendChild(transformButtonToCard(btnList[idx]));
        }
        grid.appendChild(frag);
        if (idx < btnList.length) {
          setTimeout(renderChunk, 0); // use setTimeout so ALL chunks complete reliably
        }
      }
      renderChunk();
    }, delay);
  });

  renderFavsSection();
  generateSidebar(allChars, filesByChar);
}

function generateSidebar(allChars, filesByChar) {
  const sidebar = document.getElementById('sidebar');
  allChars.forEach(char => {
    if (filesByChar[char].length === 0) return;
    const btn = document.createElement('button');
    btn.className = 'sidebar-btn';
    btn.textContent = char;
    btn.onclick = () => {
      const section = document.getElementById(`section-${char}`);
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    sidebar.appendChild(btn);
  });
}
generateAllSections();

/* =====================================================
   ENHANCED SECURITY & ANTI-INSPECT
===================================================== */
// 1. Disable Right-Click (Context Menu)
document.addEventListener('contextmenu', (e) => e.preventDefault());
// 2. Disable Key Combinations
document.addEventListener('keydown', (e) => {
    // Check for:
    // F12 (123)
    // Ctrl+Shift+I (Inspect)
    // Ctrl+Shift+J (Console)
    // Ctrl+Shift+C (Element Selector)
    // Ctrl+U (View Source)
    // Ctrl+S (Save Page)
    if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || 
        (e.ctrlKey && e.keyCode === 85) ||
        (e.ctrlKey && e.keyCode === 83)
    ) {
        e.preventDefault();
        return false;
    }
});
// 3. The "Debugger Trap"
// This pauses the browser execution if the DevTools are opened.
// It creates an infinite loop that triggers only when the console is active.
(function() {
    const tester = setInterval(() => {
        const start = performance.now();
        debugger; 
        const end = performance.now();
        if (end - start > 100) {
            // If the debugger took more than 100ms to clear, 
            // DevTools are likely open.
            console.clear();
            console.log("Developer tools are disabled for security.");
        }
    }, 1000);
})();
// ==============================
// SEARCH + UI LOGIC (from searchbut.js)
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput'); 
    const clearBtn    = document.getElementById('search-clear');
    const noResults   = document.getElementById('no-results');
    const noTerm      = document.getElementById('no-results-term');
    const searchWrap  = document.getElementById('search-wrap');

    if (!searchInput) return;

    // Focus styling
    searchInput.addEventListener('focus', () => {
        if (searchWrap) searchWrap.style.borderColor = 'rgba(var(--accent-rgb), 0.8)';
    });

    searchInput.addEventListener('blur', () => {
        if (searchWrap) searchWrap.style.borderColor = 'rgba(var(--accent-rgb), 0.3)';
    });

    // Input handling — debounced so filterGames doesn't fire on every single keypress
    let _searchDebounce = null;
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        clearBtn.style.display = q ? 'block' : 'none';
        clearTimeout(_searchDebounce);
        _searchDebounce = setTimeout(() => filterGames(q), 120);
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        searchInput.focus();
        filterGames('');
    });

    // Ctrl+F shortcut override
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    function filterGames(q) {
        const sections = document.querySelectorAll('.letter-section');
        let totalVisible = 0;

        sections.forEach(section => {
            const items = section.querySelectorAll('.game-card, input[type="button"]');
            let sectionVisible = 0;

            items.forEach(item => {
                const name = (item.querySelector('.game-card-name')?.textContent || item.value || '').toLowerCase();
                const match = !q || name.includes(q);

                item.style.display = match ? '' : 'none';
                if (match) sectionVisible++;
            });

            section.style.display = sectionVisible === 0 ? 'none' : '';
            totalVisible += sectionVisible;

            // Update count badge: show "X / total" when searching, just total when not
            const badge = section.querySelector('.section-count');
            if (badge) {
                const total = parseInt(badge.dataset.total || items.length, 10);
                if (!badge.dataset.total) badge.dataset.total = items.length; // store on first run
                badge.textContent = q ? `${sectionVisible} / ${total}` : total;
            }
        });

        if (noResults) {
            noResults.style.display = (q && totalVisible === 0) ? 'block' : 'none';
            if (noTerm) noTerm.textContent = q;
        }
    }

    // LOADING PROGRESS BAR
    const bar = document.getElementById('progress-bar');
    if (bar) {
        let progress = 0;
        bar.style.width = '0%';
        bar.style.opacity = '1';
        const interval = setInterval(() => {
            progress += Math.random() * 12;
            if (progress >= 90) { progress = 90; clearInterval(interval); }
            bar.style.width = progress + '%';
        }, 150);
        window.addEventListener('load', () => {
            clearInterval(interval);
            bar.style.width = '100%';
            setTimeout(() => {
                bar.style.opacity = '0';
                setTimeout(() => { bar.style.display = 'none'; }, 400);
            }, 800);
        });
    }
});


/* =====================================================
   SPIDERWEB BACKGROUND — loaded from spiderweb.js
   (clocker.html loads spiderweb.js before games.js)
===================================================== */

/* =====================================================
   CLOCK
===================================================== */
function updateClock(){
    const now=new Date();
    const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let hours=now.getHours();
    const mins=String(now.getMinutes()).padStart(2,'0');
    const secs=String(now.getSeconds()).padStart(2,'0');
    const ampm=hours>=12?'PM':'AM';
    hours=hours%12||12;
    const el=document.getElementById('clock');
    if(el) el.textContent=`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}  •  ${hours}:${mins}:${secs} ${ampm}`;
}
updateClock();
setInterval(updateClock,1000);




/* =====================================================
   THEME SWITCHER — no-lag CSS-variable approach + richer palette
===================================================== */
(function(){
    /* ── Palette ── richer, more distinct colours ── */
    const themes = {
        blue:   { hex:'#38bdf8', rgb:'56,189,248',   bg:'#020b18,#0a1628,#061222' },
        cyan:   { hex:'#06d6c7', rgb:'6,214,199',    bg:'#011a19,#082220,#051f1d' },
        green:  { hex:'#4ade80', rgb:'74,222,128',   bg:'#021408,#081f0e,#05190a' },
        lime:   { hex:'#a3e635', rgb:'163,230,53',   bg:'#0d1a02,#121f03,#0f1c02' },
        purple: { hex:'#c084fc', rgb:'192,132,252',  bg:'#0e0320,#160529,#120420' },
        pink:   { hex:'#f472b6', rgb:'244,114,182',  bg:'#1a0212,#220318,#1c0214' },
        red:    { hex:'#f87171', rgb:'248,113,113',  bg:'#1a0505,#200606,#1c0505' },
        orange: { hex:'#fb923c', rgb:'251,146,60',   bg:'#190a02,#221003,#1c0e03' },
        gold:   { hex:'#fbbf24', rgb:'251,191,36',   bg:'#191200,#221900,#1c1500' },
        grey:   { hex:'#94a3b8', rgb:'148,163,184',  bg:'#0d1117,#141a24,#101620' },
    };

    /* ── One-time static <style> block — all rules use CSS vars only ── */
    /* This never gets rewritten on theme change; only CSS vars update  */
    const staticStyle = document.createElement('style');
    staticStyle.id = 'theme-static';
    staticStyle.textContent = `
        body { background: var(--theme-bg) !important; }
        .letter-header { color: var(--accent-blue) !important; border-bottom-color: rgba(var(--accent-rgb),.2) !important; }
        .letter-header::before { background: linear-gradient(to bottom,var(--accent-blue),rgba(var(--accent-rgb),.2)) !important; }
        #clock { color: rgba(var(--accent-rgb),.6) !important; }
        h1 { background: linear-gradient(135deg,#f9fafb,var(--accent-blue),rgba(var(--accent-rgb),.6)) !important; -webkit-background-clip:text !important; background-clip:text !important; }
        .sidebar { border-right-color: rgba(var(--accent-rgb),.15) !important; }
        .sidebar::before { background: linear-gradient(90deg,transparent,rgba(var(--accent-rgb),.4),transparent) !important; }
        .sidebar-btn { color: rgba(var(--accent-rgb),.55) !important; border-color: rgba(var(--accent-rgb),.12) !important; background: rgba(var(--accent-rgb),.04) !important; }
        .sidebar-btn:hover { border-color: rgba(var(--accent-rgb),.65) !important; color: var(--accent-blue) !important; background: rgba(var(--accent-rgb),.12) !important; box-shadow: 0 0 0 1px rgba(var(--accent-rgb),.2),0 4px 16px rgba(var(--accent-rgb),.15) !important; }
        .game-card { border-color: rgba(var(--accent-rgb),.12) !important; }
        .game-card:hover { border-color: rgba(var(--accent-rgb),.6) !important; box-shadow: 0 8px 24px rgba(0,0,0,.4),0 0 0 1px rgba(var(--accent-rgb),.18),0 0 24px rgba(var(--accent-rgb),.1) !important; }
        .game-card::before { background: linear-gradient(90deg,transparent,rgba(var(--accent-rgb),.45),transparent) !important; }
        .game-card::after { background: radial-gradient(ellipse at 30% 50%,rgba(var(--accent-rgb),.1) 0%,transparent 65%) !important; }
        .game-card-thumb { border-color: rgba(var(--accent-rgb),.15) !important; background: rgba(var(--accent-rgb),.08) !important; }
        .game-card:hover .game-card-thumb { border-color: rgba(var(--accent-rgb),.4) !important; }
        #back-to-top { border-color: rgba(var(--accent-rgb),.3) !important; color: var(--accent-blue) !important; }
        #back-to-top:hover { border-color: rgba(var(--accent-rgb),.65) !important; box-shadow: 0 8px 24px rgba(0,0,0,.5),0 0 16px rgba(var(--accent-rgb),.2) !important; }
        #back-to-top::before { background: radial-gradient(circle at center bottom,rgba(var(--accent-rgb),.15) 0%,transparent 70%) !important; }
        #progress-bar { background: linear-gradient(90deg,var(--accent-blue),rgba(var(--accent-rgb),.5)) !important; box-shadow: 0 0 8px rgba(var(--accent-rgb),.6) !important; }
        #theme-switcher { border-color: rgba(var(--accent-rgb),.2) !important; }
        .search-wrap { border-color: rgba(var(--accent-rgb),.25) !important; }
        .search-wrap:focus-within { border-color: rgba(var(--accent-rgb),.6) !important; box-shadow: 0 0 0 3px rgba(var(--accent-rgb),.08) !important; }
        .quick-tags code { background: rgba(var(--accent-rgb),.1) !important; color: rgba(var(--accent-rgb),.85) !important; border-color: rgba(var(--accent-rgb),.15) !important; }
        .quick-tags code:hover { background: rgba(var(--accent-rgb),.22) !important; }
        .info-card { border-color: rgba(var(--accent-rgb),.12) !important; }
        .info-card:hover { border-color: rgba(var(--accent-rgb),.3) !important; }
        ::-webkit-scrollbar-thumb { background-color: rgba(var(--accent-rgb),.35) !important; }
        .section-count { color: rgba(var(--accent-rgb),.45) !important; }
        .skeleton-thumb,.skeleton-line { background: rgba(var(--accent-rgb),.09) !important; }
        .game-card-skeleton { border-color: rgba(var(--accent-rgb),.07) !important; }
        .game-card-skeleton::after { background: linear-gradient(90deg,transparent,rgba(var(--accent-rgb),.07),transparent) !important; }
    `;
    document.head.appendChild(staticStyle);

    // Thumbnail regen removed — CSS-based thumbs update instantly with CSS vars

    /* ── applyTheme: updates CSS vars only — card thumbs update instantly via CSS ── */
    function applyTheme(name) {
        const t = themes[name] || themes.blue;
        const root = document.documentElement;
        const [c1, c2, c3] = t.bg.split(',');
        root.style.setProperty('--accent-blue', t.hex);
        root.style.setProperty('--accent-rgb',  t.rgb);
        root.style.setProperty('--theme-bg',
            `radial-gradient(ellipse at top right,${c1} 0%,${c2} 50%,${c2} 100%),` +
            `radial-gradient(ellipse at bottom left,${c3} 0%,${c2} 70%)`
        );
        localStorage.setItem('siteTheme', name);
        document.querySelectorAll('.theme-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.theme === name)
        );
        // No regen needed — all thumbs use rgba(var(--accent-rgb),...) and update instantly
    }

    /* ── Build theme buttons dynamically from palette ── */
    const switcher = document.getElementById('theme-switcher');
    if (switcher) {
        /* colour swatches for each theme button */
        const swatchColors = {
            blue:'#38bdf8', cyan:'#06d6c7', green:'#4ade80', lime:'#a3e635',
            purple:'#c084fc', pink:'#f472b6', red:'#f87171',
            orange:'#fb923c', gold:'#fbbf24', grey:'#94a3b8',
        };

        const toggle = document.createElement('button');
        toggle.textContent = '🎨';
        toggle.title = 'Themes';
        toggle.style.cssText = 'background:none;border:none;cursor:pointer;font-size:17px;padding:0 2px;line-height:1;flex-shrink:0;transition:transform 0.2s ease;';
        toggle.addEventListener('mouseenter', () => toggle.style.transform = 'scale(1.2) rotate(-10deg)');
        toggle.addEventListener('mouseleave', () => toggle.style.transform = 'scale(1)');

        const wrap = document.createElement('div');
        wrap.id = 'theme-switcher-wrap';
        wrap.className = 'open'; // starts open

        Object.keys(themes).forEach(name => {
            const btn = document.createElement('button');
            btn.className = 'theme-btn';
            btn.dataset.theme = name;
            btn.title = name.charAt(0).toUpperCase() + name.slice(1);
            btn.style.background = swatchColors[name] || '#888';
            btn.addEventListener('click', () => applyTheme(name));
            wrap.appendChild(btn);
        });

        switcher.innerHTML = '';
        switcher.appendChild(toggle);
        switcher.appendChild(wrap);

        let open = true;
        toggle.addEventListener('click', () => {
            open = !open;
            wrap.classList.toggle('open', open);
        });
    }

    applyTheme(localStorage.getItem('siteTheme') || 'blue');
})();

/* =====================================================
   QUICK TAG CLICK SEARCH
===================================================== */
document.querySelectorAll('.quick-tags code').forEach(tag => {
    tag.addEventListener('click', () => {
        const input = document.getElementById('searchInput');
        if (!input) return;
        input.value = tag.textContent;
        input.dispatchEvent(new Event('input'));
        input.focus();
    });
});
/* =====================================================
   CARD TRANSFORMER
===================================================== */
function formatName(raw) {
    return raw
        .replace(/^cl/i, '')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([a-zA-Z])(\d)/g, '$1 $2')
        .replace(/(\d)([a-zA-Z])/g, '$1 $2')
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase());
}

/* =====================================================
   THUMBNAIL — pure CSS div, updates with theme instantly, zero regen lag
===================================================== */

function _thumbHash(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return h;
}

function makeCSSThumb(displayName) {
    const letter = (displayName.replace(/^cl/i, '')[0] || '?').toUpperCase();
    const hash = _thumbHash(displayName);
    const bgOpacity  = (0.22 + (hash % 9) * 0.018).toFixed(3);
    const letOpacity = (0.70 + (hash % 5) * 0.06).toFixed(3);
    const thumb = document.createElement('div');
    thumb.className = 'game-card-thumb';
    thumb.style.cssText =
        `background:rgba(var(--accent-rgb),${bgOpacity});` +
        `color:rgba(var(--accent-rgb),${letOpacity});`;
    thumb.textContent = letter;
    return thumb;
}

function transformButtonToCard(btn) {
    const file = btn.value;
    const displayName = formatName(file);
    const clickHandler = btn.onclick;

    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.file = file;
    card.dataset.name = displayName.toLowerCase();

    const thumb = makeCSSThumb(displayName);




    const nameSpan = document.createElement('span');
    nameSpan.className = 'game-card-name';
    nameSpan.textContent = displayName;
    nameSpan.dataset.fullname = displayName;

    // Star button
    const star = document.createElement('button');
    star.className = 'star-btn' + (isFav(file) ? ' starred' : '');
    star.dataset.file = file;
    star.textContent = isFav(file) ? '★' : '☆';
    star.title = 'Add to Favorites';
    star.onclick = (e) => { e.stopPropagation(); toggleFav(file); };

    card.appendChild(thumb);
    card.appendChild(nameSpan);
    card.appendChild(star);
    card.onclick = clickHandler;

    if (btn.parentNode) btn.parentNode.replaceChild(card, btn);
    return card;
}

function transformButtons() {
    document.querySelectorAll('.buttons-container input[type="button"]').forEach(btn => {
        transformButtonToCard(btn);
    });
}

transformButtons();

/* =====================================================
   GAME CARD TOOLTIP — fixed-position so it escapes overflow:hidden
===================================================== */
(function() {
    const tip = document.createElement('div');
    tip.className = 'game-card-tooltip';
    document.body.appendChild(tip);

    let hideTimer = null;

    document.addEventListener('mouseover', e => {
        const card = e.target.closest('.game-card');
        if (!card) return;
        const nameEl = card.querySelector('.game-card-name');
        if (!nameEl) return;

        // Only show if text is actually truncated
        if (nameEl.scrollWidth <= nameEl.clientWidth) return;

        clearTimeout(hideTimer);
        const fullName = nameEl.dataset.fullname || nameEl.textContent;
        tip.textContent = fullName;

        const rect = card.getBoundingClientRect();
        tip.style.left = (rect.left + rect.width / 2) + 'px';
        tip.style.top  = (rect.top - 10) + 'px';
        tip.style.transform = 'translate(-50%, -100%)';
        tip.classList.add('visible');
    });

    document.addEventListener('mouseout', e => {
        const card = e.target.closest('.game-card');
        if (!card) return;
        hideTimer = setTimeout(() => tip.classList.remove('visible'), 80);
    });
})();
/* =====================================================
   BACK TO TOP
===================================================== */
(function(){
    const btn = document.getElementById('back-to-top');
    const scroller = document.querySelector('.main-content');
    if (!btn || !scroller) return;
    btn.style.display = 'flex';
    scroller.addEventListener('scroll', () => {
        if (scroller.scrollTop > 400) {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        } else {
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
        }
    });
    btn.onclick = () => scroller.scrollTo({ top: 0, behavior: 'smooth' });
})();