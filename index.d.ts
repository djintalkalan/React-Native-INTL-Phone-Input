import { Component, FC } from 'react';
import { ColorValue, TextInputProps, ViewStyle } from 'react-native';


declare module "dj-intl-phone-input" {

    interface IntlPhoneInputProps {
        lang?: string,
        defaultCountry?: string,
        mask?: string,
        onChangeText?: (data: IOnChangeText) => void,
        customModal?: (modalVisible: boolean, countryData: any, onCountryChange: (code: string) => void) => FC,
        phoneInputStyle?: any, // {}
        containerStyle?: any, // {}
        dialCodeTextStyle?: any, // {}
        flagStyle?: any, // {}
        modalContainer?: any, // {}
        filterInputStyle?: any, // {}
        closeButtonStyle?: any, // {}
        modalCountryItemCountryNameStyle?: any, // {}
        filterText?: string,
        closeText?: string,
        searchIconStyle?: any,
        disableCountryChange?: boolean,
        inputRef?: any,
        maskPlaceholder?: boolean
        placeholderTextColor?: string,
        dialCode?: string,
        selectedPhone?: string
        countryModalStyle?: ViewStyle,
        modalFlagStyle?: ViewStyle,
        modalCountryItemCountryDialCodeStyle?: ViewStyle,
        renderAction?: () => void
        inputProps?: TextInputProps
        extraCountries?: Array<ICountry>
        disableDefaultCountries?: boolean
        sortBy: "lang" | 'code' | 'dialCode'
    }

    interface IOnChangeText {
        dialCode: string,
        unmaskedPhoneNumber: string,
        phoneNumber: string,
        isVerified: boolean,
        selectedCountry: ICountry
    }

    interface IntlPhoneInputState {
        defaultCountry: ICountry,
        flag: any,
        modalVisible: boolean,
        dialCode: string,
        phoneNumber: string,
        mask: string,
        countryData: any,
        selectedCountry: ICountry,
        placeholderTextColor: ColorValue
    }

    interface ICountry {
        ru: string,
        lt: string,
        tr: string,
        en: string,
        flag: any,
        code: string,
        dialCode: string,
        mask: string
    }

    export default class IntlPhoneInput extends Component<IntlPhoneInputProps> {

    }

}