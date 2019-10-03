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
const View = require('../../Views/View.web')
const commonComponents_tables = require('../../MMAppUICommonComponents/tables.web')
const commonComponents_actionButtons = require('../../MMAppUICommonComponents/actionButtons.web')
const commonComponents_navigationBarButtons = require('../../MMAppUICommonComponents/navigationBarButtons.web')
const StackAndModalNavigationView = require('../../StackNavigation/Views/StackAndModalNavigationView.web')
const ContactQRDisplayModalView = require('./ContactQRDisplayModalView.web')
//
class ContactDetailsView extends View
{
	constructor(options, context)
	{
		super(options, context) // call super before `this`
		const self = this 
		{
			self.contact = self.options.record // just going to call this contact internally for now unless we factor a RecordDetailsView (does not seem likely)
			if (typeof self.contact === 'undefined' || !self.contact) {
				throw self.constructor.name + " requires a self.options.record"
			}
		}
		self.setup()
	}
	setup()
	{
		const self = this
		self.setup_views()
		self.startObserving_contact()
	}
	setup_views()
	{
		const self = this
		const margin_h = 16
		{
			const layer = self.layer
			layer.style.webkitUserSelect = "none" // disable selection here but enable selectively
			// no need to support other browsers here yet b/c this is not available in the web wallet
			//
			layer.style.position = "relative" // to make sure children with position:fixed are laid out relative to parent
			layer.style.boxSizing = "border-box"
			layer.style.width = "100%"
			layer.style.height = "100%"
			//
			layer.style.backgroundColor = "#272527" // so we don't get a strange effect when pushing self on a stack nav view
			//
			layer.style.color = "#c0c0c0" // temporary
			//
			layer.style.overflowY = "auto"
			// layer.style.webkitOverflowScrolling = "touch"
			//
			layer.style.padding = `0 ${margin_h}px 60px ${margin_h}px` // actually going to change paddingTop in self.viewWillAppear() if navigation controller
			//
			layer.style.wordBreak = "break-all" // to get the text to wrap
		}
		{
			const containerLayer = document.createElement("div")
			containerLayer.style.border = "0.5px solid #494749"
			containerLayer.style.borderRadius = "5px"
			containerLayer.style.margin = `16px 0 0px 0`
			containerLayer.style.padding = "0 0 0 15px" // to get separator inset
			//
			self.tableSection_containerLayer = containerLayer
			{
				self._setup_field_address()
				self._setup_field__cached_OAResolved_XMR_address()
				self._setup_field__derived__integrated_XMR_address()
				containerLayer.appendChild(commonComponents_tables.New_separatorLayer(self.context))
				self._setup_field_paymentID()
			}
			self.layer.appendChild(containerLayer)
		}
		self._setup_URIContainerLayer()
		{ // action buttons toolbar
			var view;
			if (self.context.themeController.TabBarView_isHorizontalBar() === false) {
				const actionButtonsContainerView_margin_h = 16
				const margin_fromWindowLeft = self.context.themeController.TabBarView_thickness() + actionButtonsContainerView_margin_h // we need this for a position:fixed, width:100% container
				const margin_fromWindowRight = actionButtonsContainerView_margin_h
				view = commonComponents_actionButtons.New_ActionButtonsContainerView(
					margin_fromWindowLeft, 
					margin_fromWindowRight, 
					self.context
				)
			} else {
				view = commonComponents_actionButtons.New_Stacked_ActionButtonsContainerView(
					0, 
					0, 
					15,
					self.context
				)
			}
			self.actionButtonsContainerView = view
			{
				self._setup_actionButton_send()
				self._setup_actionButton_request()
			}
			self.addSubview(view)
		}
	}
	_setup_field_address()
	{
		const self = this
		const fieldLabelTitle = "Address"
		const value = self.contact.address
		const valueToDisplayIfValueNil = "N/A"
		const div = commonComponents_tables.New_copyable_longStringValueField_component_fieldContainerLayer(
			self.context,
			fieldLabelTitle, 
			value,
			self.context.pasteboard, 
			valueToDisplayIfValueNil
		)
		div.style.paddingRight = "16px" // manually here cause we removed right padding on container to get separator flush with right side 
		self.address__valueField_component = div
		self.tableSection_containerLayer.appendChild(div)
	}
	_setup_field__cached_OAResolved_XMR_address()
	{
		const self = this
		const fieldLabelTitle = "XMR Address (cached)"
		const value = self.contact.cached_OAResolved_XMR_address
		const valueToDisplayIfValueNil = "N/A"
		const div = commonComponents_tables.New_copyable_longStringValueField_component_fieldContainerLayer(
			self.context,
			fieldLabelTitle, 
			value,
			self.context.pasteboard, 
			valueToDisplayIfValueNil
		)
		div.style.paddingRight = "16px" // manually here cause we removed right padding on container to get separator flush with right side 
		self.cached_OAResolved_XMR_address__valueField_component = div
		if (typeof value === 'undefined' || !value) {
			div.style.display = "none"
		}
		self.tableSection_containerLayer.appendChild(div)
	}
	_setup_field__derived__integrated_XMR_address()
	{
		const self = this
		const fieldLabelTitle = "Integrated Address (derived)"
		const value = self.contact.new_integratedXMRAddress_orNilIfNotApplicable()
		const valueToDisplayIfValueNil = "N/A"
		const div = commonComponents_tables.New_copyable_longStringValueField_component_fieldContainerLayer(
			self.context,
			fieldLabelTitle, 
			value,
			self.context.pasteboard, 
			valueToDisplayIfValueNil
		)
		div.style.paddingRight = "16px" // manually here cause we removed right padding on container to get separator flush with right side 
		self.derived__integrated_XMR_address__valueField_component = div
		if (typeof value === 'undefined' || !value) {
			div.style.display = "none"
		}
		self.tableSection_containerLayer.appendChild(div)
	}
	_setup_field_paymentID()
	{
		const self = this
		const fieldLabelTitle = "Payment ID"
		const value = self.contact.payment_id
		const valueToDisplayIfValueNil = "None"
		const div = commonComponents_tables.New_copyable_longStringValueField_component_fieldContainerLayer(
			self.context,
			fieldLabelTitle, 
			value,
			self.context.pasteboard, 
			valueToDisplayIfValueNil
		)
		div.style.paddingRight = "16px" // manually here cause we removed right padding on container to get separator flush with right side 
		self.payment_id__valueField_component = div
		self.tableSection_containerLayer.appendChild(div)
	}
	//
	__new_flatTable_sectionContainerLayer(isFirst)
	{
		const self = this
		const layer = document.createElement("div")
		{
			layer.style.border = "0.5px solid #494749"
			layer.style.borderRadius = "5px"
			layer.style.margin = `${isFirst ? 16 : 20}px 0px 0px 0px`
			layer.style.padding = "0"
		}
		return layer
	}
	_setup_URIContainerLayer()
	{
		const self = this
		const containerLayer = self.__new_flatTable_sectionContainerLayer(false)
		containerLayer.style.padding = "0 0 0 15px" // to get separator inset
		{
			const div = commonComponents_tables.New_fieldContainerLayer(self.context)
			div.style.padding = "15px 0 17px 0"
			{
				{ // left
					const labelLayer = commonComponents_tables.New_fieldTitle_labelLayer("QR Code", self.context)
					labelLayer.style.margin = "0 0 0 0"
					labelLayer.style.padding = "0"
					div.appendChild(labelLayer)
				}
				{ // right
					const buttonLayer = commonComponents_tables.New_customButton_aLayer(
						self.context, 
						"SAVE",
						true, // isEnabled, defaulting to true on undef
						function()
						{
							self._userSelectedDownloadButton()
						}
					);
					self.saveQRImage_buttonLayer = buttonLayer
					buttonLayer.style.float = "right"
					buttonLayer.style.marginRight = "18px"
					div.appendChild(buttonLayer)
				}
				div.appendChild(commonComponents_tables.New_clearingBreakLayer())
				{ 
					const qrContainer_div = document.createElement("div")
					let side = 56
					let imageInset = 0
					{
						const layer = qrContainer_div
						layer.style.overflow = "hidden" // we can clip (to get corner radius) b/c no drop shadow here (TODO?: because the actual qr code image that is generated by this app's dependency includes some whitespace padding the qr data content!)
						layer.style.position = "relative"
						layer.style.width = side + "px"
						layer.style.height = side + "px"
						layer.style.padding = "0"
						layer.style.borderRadius = "3px"
						layer.style.backgroundColor = "#fff" // to match the image itself
						layer.style.margin = "10px 15px 0 0"
					}
					div.appendChild(qrContainer_div)
					//
					let imgDataURIString = self.contact.qrCode_imgDataURIString
					const valueLayer = commonComponents_tables.New_fieldValue_base64DataImageLayer(
						imgDataURIString, 
						self.context
					)
					{
						const layer = valueLayer
						layer.style.margin = "0"
						layer.style.width = side+"px"
						layer.style.height = side+"px"
						layer.style.position = "absolute"
						layer.style.left = "0"
						layer.style.top = "0"
						layer.style.cursor = "pointer"
					}
					valueLayer.addEventListener("click", function(e)
					{
						e.preventDefault()
						{
							const view = new ContactQRDisplayModalView({
								contact: self.contact
							}, self.context)
							const navigationView = new StackAndModalNavigationView({}, self.context)
							navigationView.SetStackViews([ view ])
							self.navigationController.PresentView(navigationView, true)
						}
						return false
					})
					qrContainer_div.appendChild(valueLayer)
				}
			}
			containerLayer.appendChild(div)
		}
		self.layer.appendChild(containerLayer)
	}
	//
	_setup_actionButton_send()
	{
		const self = this
		const buttonView = commonComponents_actionButtons.New_ActionButtonView(
			"Pay", 
			self.context.crossPlatform_appBundledIndexRelativeAssetsRootPath+"Contacts/Resources/actionButton_iconImage__send@3x.png", // relative to index.html
			false,
			function(layer, e)
			{
				self.context.walletAppCoordinator.Trigger_sendFundsToContact(self.contact)
			},
			self.context,
			undefined,
			undefined,
			"16px 16px"
		)
		self.actionButtonsContainerView.addSubview(buttonView)
	}
	_setup_actionButton_request()
	{
		const self = this
		const buttonView = commonComponents_actionButtons.New_ActionButtonView(
			"Request", 
			self.context.crossPlatform_appBundledIndexRelativeAssetsRootPath+"Contacts/Resources/actionButton_iconImage__request@3x.png", // relative to index.html
			true,
			function(layer, e)
			{
				self.context.walletAppCoordinator.Trigger_requestFundsFromContact(self.contact)
			},
			self.context,
			undefined,
			undefined,
			"16px 16px"
		)
		self.actionButtonsContainerView.addSubview(buttonView)
	}
	//
	startObserving_contact()
	{
		const self = this
		// info update
		self._contact_EventName_contactInfoUpdated_fn = function()
		{
			if (self.navigationController) {
				self.navigationController.SetNavigationBarTitleNeedsUpdate() // because it's derived from the contact values
			} else {
				console.warn("⚠️  Contact info updated observed while self.navigationController nil.")
			}
			self._configureUIWith_contact(self.contact)
		}
		self.contact.on(
			self.contact.EventName_contactInfoUpdated(),
			self._contact_EventName_contactInfoUpdated_fn
		)
		// deletion
		self._contact_EventName_willBeDeleted_fn = function()
		{ // ^-- we observe /will/ instead of /did/ because if we didn't, self.navigationController races to get freed
			const current_topStackView = self.navigationController.topStackView
			const isOnTop = current_topStackView.IsEqualTo(self) == true
			if (isOnTop) {
				setTimeout(function()
				{
					self.navigationController.PopView(true) // animated
				}, 500) // because we want to wait until whatever UI deleted it settles down or we will get a refusal to pop while dismissing a modal
			} else { // or, we're not on top, so let's just remove self from the list of views
				const warnStr = "A contact details view expected to be on top of navigation stack when its contact was deleted. Did this View not get torn down?"
				console.warn(warnStr)
				// throw warnStr
				// which means the following line may need to be uncommented and the method ImmediatelyExtractStackView needs to be implemented (which will w/o animation snatch self out of the stack)
				// self.navigationController.ImmediatelyExtractStackView(self)
			}
		}
		self.contact.on(
			self.contact.EventName_willBeDeleted(),
			self._contact_EventName_willBeDeleted_fn
		)
	}
	//
	//
	// Lifecycle - Teardown
	//
	TearDown()
	{
		super.TearDown()
		const self = this
		self.stopObserving_contact()
		self.tearDownAnySpawnedReferencedPresentedViews()
	}
	tearDownAnySpawnedReferencedPresentedViews()
	{
		const self = this
		if (typeof self.current_EditContactFromContactsTabView !== 'undefined' && self.current_EditContactFromContactsTabView) {
			self.current_EditContactFromContactsTabView.TearDown()
			self.current_EditContactFromContactsTabView = null
		}
	}
	stopObserving_contact()
	{
		const self = this
		self.contact.removeListener(
			self.contact.EventName_contactInfoUpdated(),
			self._contact_EventName_contactInfoUpdated_fn
		)
		self.contact.removeListener(
			self.contact.EventName_willBeDeleted(),
			self._contact_EventName_willBeDeleted_fn
		)
	}	
	//
	//
	// Runtime - Accessors - Navigation
	//
	Navigation_Title()
	{
		const self = this
		var title = ""
		const emoji = self.contact.emoji
		if (typeof emoji !== 'undefined' && emoji) {
			var spacing;
			if (self.context.Emoji_renderWithNativeEmoji === true) {
				spacing = "&nbsp;&nbsp;&nbsp;&nbsp;"
			} else {
				spacing = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
			}
			title += emoji + spacing // extra spaces for emoji
		}
		title += self.contact.fullname
		//
		return title
	}
	Navigation_Title_pageSpecificCSS_paddingLeft()
	{
		return 10 // to account for the emojione img getting cut off when title too long
	}
	Navigation_New_RightBarButtonView()
	{
		const self = this
		//
		const view = commonComponents_navigationBarButtons.New_RightSide_EditButtonView(self.context)
		const layer = view.layer
		{ // observe
			layer.addEventListener(
				"click",
				function(e)
				{
					e.preventDefault()
					//
					if (self.navigationController.isCurrentlyTransitioningAManagedView__Modal == true) {
						console.warn("Ignoring ix on rightBarButtonView while self.navigationController.isCurrentlyTransitioningAManagedView__Modal=true")
						return
					}
					{ // v--- self.navigationController because self is presented packaged in a StackNavigationView				
						const StackAndModalNavigationView = require('../../StackNavigation/Views/StackAndModalNavigationView.web')
						const EditContactFromContactsTabView = require('./EditContactFromContactsTabView.web')
						//
						const options = 
						{
							contact: self.contact
						}
						const view = new EditContactFromContactsTabView(options, self.context)
						self.current_EditContactFromContactsTabView = view
						const navigationView = new StackAndModalNavigationView({}, self.context)
						navigationView.SetStackViews([ view ])
						self.navigationController.PresentView(navigationView, true)
					}
					//
					return false
				}
			)
		}
		return view
	}	
	//
	//
	// Runtime - Imperatives - Configuration
	//
	_configureUIWith_contact()
	{
		const self = this
		// TODO: diffing might be nice here
		{
			const value = self.contact.address
			const layer = self.address__valueField_component
			layer.Component_SetValue(value)
		}
		{
			const value = self.contact.cached_OAResolved_XMR_address
			const layer = self.cached_OAResolved_XMR_address__valueField_component
			if (!value || typeof value === 'undefined') {
				layer.style.display = "none"
			} else {
				layer.Component_SetValue(value)
				layer.style.display = "block"
			}
		}
		{
			const value = self.contact.new_integratedXMRAddress_orNilIfNotApplicable()
			const layer = self.derived__integrated_XMR_address__valueField_component
			if (!value || typeof value === 'undefined') {
				layer.style.display = "none"
			} else {
				layer.Component_SetValue(value)
				layer.style.display = "block"
			}
		}
		{
			const value = self.contact.payment_id
			const layer = self.payment_id__valueField_component
			layer.Component_SetValue(value)
		}
	}	
	//
	//
	// Runtime - Delegation - Navigation/View lifecycle
	//
	viewWillAppear()
	{
		const self = this
		super.viewWillAppear()
		if (typeof self.navigationController !== 'undefined' && self.navigationController !== null) {
			self.layer.style.paddingTop = `${self.navigationController.NavigationBarHeight()}px`
		}
	}
	// Runtime - Protocol / Delegation - Stack & modal navigation 
	// We don't want to naively do this on VDA as else tab switching may trigger it - which is bad
	navigationView_didDismissModalToRevealView()
	{
		const self = this
		if (super.navigationView_didDismissModalToRevealView) {
			super.navigationView_didDismissModalToRevealView() // in case it exists
		}
		self.tearDownAnySpawnedReferencedPresentedViews()
	}
	navigationView_didPopToRevealView()
	{
		const self = this
		if (super.navigationView_didPopToRevealView) {
			super.navigationView_didPopToRevealView() // in case it exists
		}
		self.tearDownAnySpawnedReferencedPresentedViews()
	}
	//
	// Delegation - Interactions
	_userSelectedDownloadButton()
	{
		const self = this
		self.saveQRImage_buttonLayer.Component_SetEnabled(false)
		self.context.userIdleInWindowController.TemporarilyDisable_userIdle() // TODO: this is actually probably a bad idea - remove this and ensure that file picker canceled on app teardown
		// ^ so we don't get torn down while dialog open
		function __trampolineFor_didFinish()
		{ // ^ essential we call this from now on if we are going to finish with this codepath / exec control
			self.saveQRImage_buttonLayer.Component_SetEnabled(true)
			self.context.userIdleInWindowController.ReEnable_userIdle()
		}
		self.context.filesystemUI.PresentDialogToSaveBase64ImageStringAsImageFile(
			self.contact.qrCode_imgDataURIString,
			"Save Contact",
			"Contact info",
			function(err)
			{
				if (err) {
					const errString = err.message 
						? err.message 
						: err.toString() 
							? err.toString() 
							: ""+err
					navigator.notification.alert(
						errString, 
						function() {}, // nothing to do 
						"Error", 
						"OK"
					)
					__trampolineFor_didFinish()
					return
				}
				// console.log("Downloaded QR code")
				__trampolineFor_didFinish() // re-enable idle timer
			}
		)
	}

}
module.exports = ContactDetailsView