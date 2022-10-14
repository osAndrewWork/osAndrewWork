//=============================================================================

/* Підключення бібліотек JavaScript */
// const  CACertificates = require ('./CACertificates.p7b');
var fs = require('fs');
eval(fs.readFileSync('./src/NodeJS/lib/euscpt.js')+'');
eval(fs.readFileSync('./src/NodeJS/lib/euscpm.js')+'');
eval(fs.readFileSync('./src/NodeJS/lib/euscp.js')+'');

//-----------------------------------------------------------------------------

var g_euSign = null;
var g_isLibraryLoaded = false;

// constants
/* Налаштування серверів ЦСК */
var g_CAs = "./CAs.Test.json"

/* Масив з шляхом до кореневих сертификатів ЦЗО та ЦСК */
var g_CACerts = [
	"./CACertificates.Test.p7b",
];

/* Налаштування ЦСК за замовчанням */
var g_CADefaultSettings = {
	"issuerCNs": 				["Акредитований центр сертифікації ключів ІДД ДФС",
		"Акредитований центр сертифікації ключів ІДД Міндоходів",
		"Акредитований центр сертифікації ключів ІДД ДПС"],
	"address": 					"acskidd.gov.ua",
	"ocspAccessPointAddress":	"acskidd.gov.ua/services/ocsp/",
	"ocspAccessPointPort":		"80",
	"cmpAddress":				"acskidd.gov.ua",
	"tspAddress":				"acskidd.gov.ua",
	"tspAddressPort":			"80",
	"directAccess":				true
};

const EDS_STORE_NAME = '/certificates';
const CA_DEFAULT_SERVER = 'acskidd.gov.ua';
const CA_DEFAULT_PORT = '80';

//=============================================================================

/* Ініціалізація налаштувань криптографічної бібліотеки */
function SetSettings(CAs, CASettings) {
	var offline = true;
	var useOCSP = false;
	var useCMP = false;

	offline = ((CASettings == null) ||
		(CASettings.address == "")) ?
		true : false;
	useOCSP = (!offline && (CASettings.ocspAccessPointAddress != ""));
	useCMP = (!offline && (CASettings.cmpAddress != ""));

	g_euSign.SetJavaStringCompliant(true);

	var settings = g_euSign.CreateFileStoreSettings();
	settings.SetPath('');
	settings.SetSaveLoadedCerts(false);
	g_euSign.SetFileStoreSettings(settings);

	settings = g_euSign.CreateModeSettings();
	settings.SetOfflineMode(offline);
	g_euSign.SetModeSettings(settings);

	settings = g_euSign.CreateProxySettings();
	g_euSign.SetProxySettings(settings);

	settings = g_euSign.CreateTSPSettings();
	settings.SetGetStamps(!offline);
	if (!offline) {
		if (CASettings.tspAddress != "") {
			settings.SetAddress(CASettings.tspAddress);
			settings.SetPort(CASettings.tspAddressPort);
		} else if (g_CADefaultSettings){
			settings.SetAddress(g_CADefaultSettings.tspAddress);
			settings.SetPort(g_CADefaultSettings.tspAddressPort);
		}
	}
	g_euSign.SetTSPSettings(settings);

	settings = g_euSign.CreateOCSPSettings();
	if (useOCSP) {
		settings.SetUseOCSP(true);
		settings.SetBeforeStore(true);
		settings.SetAddress(CASettings.ocspAccessPointAddress);
		settings.SetPort("80");
	}
	g_euSign.SetOCSPSettings(settings);

	settings = g_euSign.CreateOCSPAccessInfoModeSettings();
	settings.SetEnabled(true);
	g_euSign.SetOCSPAccessInfoModeSettings(settings);
	settings = g_euSign.CreateOCSPAccessInfoSettings();
	for (var i = 0; i < CAs.length; i++) {
		settings.SetAddress(CAs[i].ocspAccessPointAddress);
		settings.SetPort(CAs[i].ocspAccessPointPort);

		for (var j = 0; j < CAs[i].issuerCNs.length; j++) {
			settings.SetIssuerCN(CAs[i].issuerCNs[j]);
			g_euSign.SetOCSPAccessInfoSettings(settings);
		}
	}

	settings = g_euSign.CreateCMPSettings();
	settings.SetUseCMP(useCMP);
	if (useCMP) {
		settings.SetAddress(CASettings.cmpAddress);
		settings.SetPort("80");
	}
	g_euSign.SetCMPSettings(settings);

	settings = g_euSign.CreateLDAPSettings();
	g_euSign.SetLDAPSettings(settings);
}

//-----------------------------------------------------------------------------

/* Імпорт сертифікатів до сховища криптографічної бібліотеки */
function LoadCertificates(certsFilePathes) {
	if (!certsFilePathes)
		return;

	for (var i = 0; i < certsFilePathes.length; i++) {
		var path = certsFilePathes[i];
		var data = new Uint8Array(fs.readFileSync(path));
		if (path.substring(path.length - 3) === 'p7b') {
			g_euSign.SaveCertificates(data);
		} else {
			g_euSign.SaveCertificate(data);
		}
	}
}


/* Ініціалізація криптографічної бібліотеки та встановлення налаштувань */
function Initialize(readPrivKey) {
	/* Перевірка необхідності ініціалізації криптографічної бібліотеки */
	if (!g_euSign.IsInitialized()) {
		/* Ініціалізація криптографічної бібліотеки */
		g_euSign.Initialize();
	}

	/* Перевірка необхідності встановлення налаштувань крипт. бібліотеки */
	if (g_euSign.DoesNeedSetSettings()) {
		/* Зчитування файлу з налаштуваннями ЦСК */
		var CAs = JSON.parse(fs.readFileSync(g_CAs), 'utf8');

		var CASettings = null;

		/* Встановлення параметрів за замовчанням */
		SetSettings(CAs, CASettings);

		/* Завантаження сертифікатів ЦСК */
		LoadCertificates(g_CACerts);
	}
}

//=============================================================================

/* Формування зовнішнього підпису (дані та підпис знаходяться окремо) від */
/* даних типу Uint8Array. Функція повертає підпис у вигляді base64 */
/* У разі виникнення помилки, буде виключення */
function SignData(data) {
	if (!g_isLibraryLoaded)
		throw "Library not loaded";

	Initialize(true);

	return g_euSign.SignData(data, true);
}
//-----------------------------------------------------------------------------
/* Перевірка зовнішнього підпису (дані та підпис знаходяться окремо) від */
/* даних типу Uint8Array. Функція повертає інф. про підпис у вигляді */
/* об'єкту типу EndUserSignInfo */
/* У разі виникнення помилки, буде виключення */
function VerifyData(data, sign) {
	if (!g_isLibraryLoaded)
		throw "Library not loaded";

	Initialize(false);

	return g_euSign.VerifyData(data, sign);
}

/* Функція викликається після завантаження бібліотеки */
/* Функції бібліотеки можна викликати тільки після виклику EUSignCPModuleInitialized */
function EUSignCPModuleInitialized(isInitialized) {
	g_isLibraryLoaded = isInitialized;

	/* Приклад відображення інф. про підпис */
	// var _printSignInfo = function(signInfo) {
	// 	var signerInfo = signInfo.GetOwnerInfo();
	// 	var signTimeInfo = signInfo.GetTimeInfo();
	// 	console.log("Sign info:");
	// 	console.log("Signer info:");
	// 	console.log("\tSubject CN:" + signerInfo.GetSubjCN());
	// 	console.log("\tCA:" + signerInfo.GetIssuerCN());
	// 	console.log("\tSN:" + signerInfo.GetSerial());
	//
	// 	if (signTimeInfo.IsTimeAvail()) {
	// 		console.log((signTimeInfo.IsTimeStamp() ?
	// 			"\tTime stamp (from data):" :
	// 			"\tSign time:") + signTimeInfo.GetTime());
	// 	} else {
	// 		console.log("\tSign time: not available");
	// 	}
	//
	// 	if (signTimeInfo.IsSignTimeStampAvail()) {
	// 		console.log("\tTime stamp (from sign):" +
	// 			signTimeInfo.GetSignTimeStamp());
	// 	}
	// }
	//
	// try {
	// 	/* Дані на які накладається підпис */
	// 	var data = new Uint8Array(10);
	//
	// 	/* Приклад накладання зовнішнього підпису */
	// 	console.log("Signing data (external)...");
	// 	var signature = SignData(data);
	// 	console.log("Signature: " + signature);
	//
	// 	/* Приклад перевірки зовнішнього підпису */
	// 	console.log("Verify data (external)...");
	// 	var signInfo = VerifyData(data, signature);
	// 	_printSignInfo(signInfo);
	//
	// 	/* Приклад накладання внутрішнього підпису */
	// 	console.log("Signing data (internal)...");
	// 	var signature = SignDataInternal(data);
	// 	console.log("Signature: " + signature);
	//
	// 	/* Приклад перевірки внутрішнього підпису */
	// 	console.log("Verify data (internal)...");
	// 	var signInfo = VerifyDataInternal(signature);
	// 	_printSignInfo(signInfo);
	// } catch (e) {
	// 	console.log("Error: " + e);
	// }
}

//=============================================================================

var g_euSign = EUSignCP();


module.exports = {euSign: g_euSign,
	SignData: SignData
}
//=============================================================================