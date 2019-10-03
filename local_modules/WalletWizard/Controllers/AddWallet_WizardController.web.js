// Copyright (c) 2014-2019, MyMonero.com
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
"use strict"
//
const mnemonic_languages = require('../../mymonero_libapp_js/mymonero-core-js/cryptonote_utils/mnemonic_languages')
//
const WizardTask_Modes =
{
	FirstTime_CreateWallet: "FirstTime_CreateWallet",
	FirstTime_UseExisting: 	"FirstTime_UseExisting",
	//
	PickCreateOrUseExisting: 	"PickCreateOrUseExisting", // this will patch into one of the following two:
	AfterPick_CreateWallet: 	"AfterPick_CreateWallet",
	AfterPick_UseExisting: 		"AfterPick_UseExisting"
}
const WizardTaskStepScreenViewFilePrefix_By_WizardTaskModeName =
{
	FirstTime_CreateWallet: "CreateWallet",
	FirstTime_UseExisting: 	"UseExisting",
	//
	PickCreateOrUseExisting: 	"PickCreateOrUseExisting", // this will patch into one of the following two:
	AfterPick_CreateWallet: 	"CreateWallet",
	AfterPick_UseExisting: 		"UseExisting"
}
const StaticCacheForBundling_WizardTaskStepScreenViewModules_byViewFilename = 
{
	"PickCreateOrUseExisting_Landing_View.web": require("../Views/PickCreateOrUseExisting_Landing_View.web"),
	"UseExisting_MetaInfo_View.web": 			require("../Views/UseExisting_MetaInfo_View.web"),
	"CreateWallet_MetaInfo_View.web": 			require("../Views/CreateWallet_MetaInfo_View.web"),
	"CreateWallet_Instructions_View.web": 		require("../Views/CreateWallet_Instructions_View.web"),
	"CreateWallet_InformOfMnemonic_View.web": 	require("../Views/CreateWallet_InformOfMnemonic_View.web"),
	"CreateWallet_ConfirmMnemonic_View.web": 	require("../Views/CreateWallet_ConfirmMnemonic_View.web")
}
//
class AddWallet_WizardController
{
	constructor(options, context)
	{
		const self = this
		{
			self.options = options
			self.context = context
		}
		self.setup()
	}
	setup()
	{
		const self = this
		{
			self.current_wizardTaskModeName = null
			self.initial_wizardTaskModeName = null
		}
		self.WizardTask_ModeStepNamesByIdxStr_ByTaskModeName = {}
		if (self.context.isLiteApp != true) {
			self.WizardTask_ModeStepNamesByIdxStr_ByTaskModeName.FirstTime_CreateWallet = 
			{
				"0": "MetaInfo",
				"1": "Instructions",
				"2": "InformOfMnemonic",
				"3": "ConfirmMnemonic"
			}
		} else {
			self.WizardTask_ModeStepNamesByIdxStr_ByTaskModeName.FirstTime_CreateWallet = 
			{
				"0": "Instructions",
				"1": "InformOfMnemonic",
				"2": "ConfirmMnemonic"
			}
		}
		self.WizardTask_ModeStepNamesByIdxStr_ByTaskModeName.FirstTime_UseExisting =
		{
			"0": "MetaInfo"
		}
		self.WizardTask_ModeStepNamesByIdxStr_ByTaskModeName.PickCreateOrUseExisting = 
		{
			"0": "Landing", // only one screen before we patch to…
		}
		if (self.context.isLiteApp != true) {
			self.WizardTask_ModeStepNamesByIdxStr_ByTaskModeName.AfterPick_CreateWallet =
			{
				"0": "Landing", // provided so we can still have idx at 1 for screen after Landing after patch
				"1": "MetaInfo",
				"2": "Instructions",
				"3": "InformOfMnemonic",
				"4": "ConfirmMnemonic"
			}
		} else {
			self.WizardTask_ModeStepNamesByIdxStr_ByTaskModeName.AfterPick_CreateWallet =
			{
				"0": "Landing", // provided so we can still have idx at 1 for screen after Landing after patch
				"1": "Instructions",
				"2": "InformOfMnemonic",
				"3": "ConfirmMnemonic"
			}
		}
		self.WizardTask_ModeStepNamesByIdxStr_ByTaskModeName.AfterPick_UseExisting =
		{
			"0": "Landing", // provided so we can still have idx at 1 for screen after Landing after patch
			"1": "MetaInfo"
		}
	}
	//
	// Lifecycle - Teardown
	TearDown()
	{ // this is public and must be called manually by wallet
		const self = this
		console.log("♻️  Tearing down a " + self.constructor.name)
	}
	//
	// Runtime - Accessors - Lookups
	WizardTask_Mode_FirstTime_CreateWallet()
	{
		return WizardTask_Modes.FirstTime_CreateWallet
	}
	WizardTask_Mode_FirstTime_UseExisting()
	{
		return WizardTask_Modes.FirstTime_UseExisting
	}
	//
	WizardTask_Mode_PickCreateOrUseExisting()
	{
		return WizardTask_Modes.PickCreateOrUseExisting
	}
	WizardTask_Mode_AfterPick_CreateWallet()
	{
		return WizardTask_Modes.AfterPick_CreateWallet
	}
	WizardTask_Mode_AfterPick_UseExisting()
	{
		return WizardTask_Modes.AfterPick_UseExisting
	}
	//
	IsCurrentlyPerformingTask()
	{
		const self = this
		return self.current_wizardTaskMode != null
	}
	//
	_current_wizardTaskMode_stepNamesByIdxStr()
	{
		const self = this
		if (self.current_wizardTaskModeName == null || typeof self.current_wizardTaskModeName === 'undefined') {
			throw "asked for _current_wizardTaskMode_stepNamesByIdxStr while self.current_wizardTaskModeName nil"
		}
		const steps = self.WizardTask_ModeStepNamesByIdxStr_ByTaskModeName[self.current_wizardTaskModeName]
		//
		return steps
	}
	_current_wizardTaskMode_stepName_orNilForEnd()
	{
		const self = this
		if (self.current_wizardTaskMode_stepNamesByIdxStr == null || typeof self.current_wizardTaskMode_stepNamesByIdxStr === 'undefined') {
			throw "asked for _current_wizardTaskMode_stepName while self.current_wizardTaskMode_stepNamesByIdxStr nil"
		}
		if (self.current_wizardTaskMode_stepIdx == null || typeof self.current_wizardTaskMode_stepIdx === 'undefined') {
			throw "asked for _current_wizardTaskMode_stepName while self.current_wizardTaskMode_stepIdx nil"
		}
		const stepName = self.current_wizardTaskMode_stepNamesByIdxStr["" + self.current_wizardTaskMode_stepIdx]
		if (typeof stepName === 'undefined' || stepName == null || stepName == "") {
			return null // end
		}
		//
		return stepName
	}
	//
	// Runtime - Accessors - Factories
	_new_current_wizardTaskMode_stepView()
	{
		const self = this
		const viewFilePrefix = WizardTaskStepScreenViewFilePrefix_By_WizardTaskModeName[self.current_wizardTaskModeName]
		const viewModuleFilename = `${viewFilePrefix}_${self.current_wizardTaskMode_stepName}_View.web`
		// now we access the module not by dynamic inclusion but statically (see webpack)
		const viewConstructor = StaticCacheForBundling_WizardTaskStepScreenViewModules_byViewFilename[viewModuleFilename]
		if (!viewConstructor || typeof viewConstructor === 'undefined') {
			throw "Unable to find the file at " + viewModuleFilename
		}
		const options =
		{
			wizardController: self,
			wizardController_initial_wizardTaskModeName		: self.initial_wizardTaskModeName, 
			wizardController_current_wizardTaskModeName		: self.current_wizardTaskModeName,
			wizardController_current_wizardTaskMode_stepName: self.current_wizardTaskMode_stepName,
			wizardController_current_wizardTaskMode_stepIdx	: self.current_wizardTaskMode_stepIdx
		}
		const initialView = new viewConstructor(options, self.context)
		//
		return initialView
	}	
	//
	// Runtime - Imperatives - Entrypoints / Control
	EnterWizardTaskMode_returningNavigationView(taskModeName)
	{ // -> StackAndModalNavigationView
		const self = this
		if (self.IsCurrentlyPerformingTask()) {
			console.error("❌  Asked to enter wizard with task mode", taskModeName, "but already performing a task.")
			return
		}
		{
			if (self.initial_wizardTaskModeName == null) {
				self.initial_wizardTaskModeName = taskModeName // record the very first mode with
				// which we were initialized - for PickCreateOrUseExisting branching/patching
			}
			self._configureRuntimeStateForTaskModeName(taskModeName) // default to step idx 0
		}
		const StackAndModalNavigationView = require('../../StackNavigation/Views/StackAndModalNavigationView.web')
		const navigationView = new StackAndModalNavigationView({}, self.context)
		{
			const initialView = self._new_current_wizardTaskMode_stepView()
			navigationView.SetStackViews([ initialView ])
		}
		self.current_wizardTaskMode_navigationView = navigationView
		//
		return navigationView
	}
	_configureRuntimeStateForTaskModeName(taskModeName, toIdx_orUndefFor0)
	{
		const self = this
		self.current_wizardTaskModeName = taskModeName
		const stepIdx = typeof toIdx_orUndefFor0 !== 'undefined' ? toIdx_orUndefFor0 : 0
		self.current_wizardTaskMode_stepIdx = stepIdx
		//
		self.current_wizardTaskMode_stepNamesByIdxStr = self._current_wizardTaskMode_stepNamesByIdxStr()
		self.current_wizardTaskMode_stepName = self._current_wizardTaskMode_stepName_orNilForEnd()
	}
	//
	PatchToDifferentWizardTaskMode_byPushingScreen(patchTo_wizardTaskMode, atIndex)
	{
		const self = this
		if (self.initial_wizardTaskModeName === null) {
			throw "Asked to PatchToDifferentWizardTaskMode_byPushingScreen but wizard not yet in a task mode."
			// return
		}
		self._configureRuntimeStateForTaskModeName(patchTo_wizardTaskMode, atIndex)
		if (self.current_wizardTaskMode_stepName === null) { // is at end
			self.DismissWizardModal({
				taskFinished: true
			})
			return
		}
		// now configure UI / push
		const initialView = self._new_current_wizardTaskMode_stepView()
		self.current_wizardTaskMode_navigationView.PushView(initialView)
	}
	PatchToDifferentWizardTaskMode_withoutPushingScreen(patchTo_wizardTaskMode, atIndex)
	{
		const self = this
		if (self.initial_wizardTaskModeName === null) {
			throw "Asked to PatchToDifferentWizardTaskMode_withoutPushingScreen but wizard not yet in a task mode."
			// return
		}
		self._configureRuntimeStateForTaskModeName(patchTo_wizardTaskMode, atIndex)
	}
	//
	// Runtime - Imperatives - Steps
	ProceedToNextStep()
	{
		const self = this
		self._configureRuntimeStateForTaskModeName(
			self.current_wizardTaskModeName,
			self.current_wizardTaskMode_stepIdx + 1
		)
		if (self.current_wizardTaskMode_stepName === null) { // is at end
			self.DismissWizardModal({
				taskFinished: true
			})
			return
		}
		const nextView = self._new_current_wizardTaskMode_stepView()
		self.current_wizardTaskMode_navigationView.PushView(nextView, true)		
	}
	DismissWizardModal(opts)
	{
		const self = this
		opts = opts || {}
		const modalParentView = self.current_wizardTaskMode_navigationView.modalParentView
		modalParentView.DismissModalViewsToView(
			null, // null for top stack view
			true,
			function()
			{
				if (opts.userCancelled === true) {
					return
				} else if (opts.taskFinished === true) {
					return
				} else {
					throw "[" + self.constructor.name + "/DismissWizardModal]: unrecognized opts flag configuration: " + JSON.stringify(opts)
				}
			}
		)
	}
	//
	// Convenience - Generating new wallet
	GenerateAndUseNewWallet(
		fn,
		optl_locale_code
	) {
		const self = this
		function _with(raw__locale_code)
		{
			var compatibleLocaleCode = mnemonic_languages.compatible_code_from_locale(raw__locale_code)
			if (compatibleLocaleCode == null) {
				compatibleLocaleCode = "en" // fall back to English
			}
			self.context.walletsListController.CreateNewWallet_NoBootNoListAdd(
				function(err, walletInstance)
				{
					if (err) {
						fn(err)
						return
					}
					self.currentWalletUsedLocaleCode = compatibleLocaleCode // so it can be accessed by consumers
					self.walletInstance = walletInstance
					fn()
				},
				compatibleLocaleCode
			)
		}
		if (optl_locale_code && typeof optl_locale_code != 'undefined') {
			_with(optl_locale_code)
		} else {
			self.context.locale.Locale(function(err, currentLocale)
			{
				if (err) {
					throw err
				}
				_with(currentLocale)
			});
		}
	}
	//
	// Runtime - Delegation
	_fromScreen_userPickedCancel()
	{
		const self = this
		self.DismissWizardModal({
			userCancelled: true
		})
	}
}
module.exports = AddWallet_WizardController