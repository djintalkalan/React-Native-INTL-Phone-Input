import {
  isValidPhoneNumber
} from 'libphonenumber-js';
import _ from 'lodash';
import React from 'react';
import { ColorValue, FlatList, Image, Keyboard, Modal, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import countries, { ICountry } from './Countries';

export interface NewIntlPhoneInputProps {
  sortBy?: 'lang' | 'dialCode'
  lang?: 'ru' | 'lt' | 'tr' | 'en'
  defaultCountryCode?: string
  selectedPhone?: string
  onChangeText?: (data: IOnChangeText) => void
  inputRef?: any,
  onChangeCountry?: (c: ICountry) => void
  phoneInputStyle?: any, // {}
  containerStyle?: any, // {}
  maskPlaceholder?: boolean
  dialCodeTextStyle?: any, // {}
  flagStyle?: any, // {}
  modalContainer?: StyleProp<ViewStyle>, // {}
  filterInputStyleContainer?: StyleProp<ViewStyle>,
  filterInputStyle?: any, // {}
  closeButtonStyle?: any, // {}
  modalCountryItemCountryNameStyle?: any, // {}
  filterText?: string,
  closeText?: string,
  searchIconStyle?: any,
  disableCountryChange?: boolean,
  placeholderTextColor?: string,
  countryModalStyle?: ViewStyle,
  modalFlagStyle?: ViewStyle,
  modalCountryItemCountryDialCodeStyle?: ViewStyle,
  renderAction?: () => void
  inputProps?: TextInputProps
  extraCountries?: Array<ICountry>
  disableDefaultCountries?: boolean
}

export interface IOnChangeText {
  dialCode: string
  fixNumber?: string
  unmaskedPhoneNumber: string
  phoneNumber: string
  isVerified: boolean
  selectedCountry: ICountry
  fixedValue: string
}

export interface IntlPhoneInputState {
  defaultCountry: ICountry,
  flag: any,
  modalVisible: boolean,
  dialCode: string,
  phoneNumber: string,
  mask: string,
  selectedCountry: ICountry,
  placeholderTextColor: ColorValue
  isFilter: boolean
}

let data = countries;

const compare = (a: ICountry, b: ICountry, lang: any) => {
  //@ts-ignore
  const aName = a?.[lang] || ""
  //@ts-ignore
  const bName = b?.[lang] || ""
  return aName < bName ? -1 : aName > bName ? 1 : 0;
}

let DEFAULT_COUNTRY: ICountry = { ru: "Соединенные Штаты", lt: "Jungtinės Valstijos", tr: "Amerika Birleşik Devletleri", en: 'United States', flag: '🇺🇸', code: 'US', dialCode: '+1', mask: '(999) 999-9999', fixedValue: "" }

export class IntlPhoneInput extends React.Component<NewIntlPhoneInputProps, IntlPhoneInputState> {
  data: ICountry[];
  constructor(props: NewIntlPhoneInputProps) {
    super(props);
    data = data?.sort((a, b) => compare(a, b, !props?.sortBy ? "en" : props?.sortBy == 'lang' ? (props?.lang || "en") : props?.sortBy))
    this.data = [...data]
    let defaultCountry = data.find((obj) => obj.code == props.defaultCountryCode) || data.find((obj) => obj.code == 'US') || DEFAULT_COUNTRY;

    this.state = {
      defaultCountry,
      flag: defaultCountry?.flag,
      modalVisible: false,
      dialCode: defaultCountry.dialCode?.includes('+1') ? "+1" : defaultCountry.dialCode,
      phoneNumber: props.selectedPhone ?? "",
      mask: defaultCountry.mask,
      selectedCountry: defaultCountry,
      placeholderTextColor: 'grey',
      isFilter: false
    };
  }

  componentDidUpdate(props: NewIntlPhoneInputProps, state: IntlPhoneInputState) {

    if (props.selectedPhone != this.props.selectedPhone) {

      this.setState({ phoneNumber: this.props.selectedPhone ?? "" })
    }
    if (props?.defaultCountryCode != this.props?.defaultCountryCode) {
      const defaultCountry = data.find((obj) => obj.code == this.props.defaultCountryCode) || data.find((obj) => obj.code === 'US') || DEFAULT_COUNTRY;
      this.setState({
        defaultCountry,
        flag: defaultCountry.flag,
        modalVisible: false,
        dialCode: defaultCountry.dialCode?.includes('+1') ? "+1" : defaultCountry.dialCode,
        mask: defaultCountry.mask,
        selectedCountry: defaultCountry,
      }, () => {
      })
    }

    if (state?.selectedCountry?.code != this.state?.selectedCountry?.code) {
      this.props?.onChangeCountry && this.props?.onChangeCountry(this.state?.selectedCountry)
    }
  }

  onChangePropText = (unmaskedPhoneNumber: string, phoneNumber: string) => {
    const { dialCode, mask, selectedCountry, } = this.state;
    const countOfNumber = mask?.match(/9/g)?.length;
    if (this.props.onChangeText) {
      //@ts-ignore
      let isVerified = isValidPhoneNumber(phoneNumber, (selectedCountry?.code?.[0] + selectedCountry?.code?.[1]))
      //@ts-ignore
      // const isValidLength = validatePhoneNumberLength(phoneNumber, (selectedCountry?.code?.[0] + selectedCountry?.code?.[1]))
      // let isVerified = countOfNumber === unmaskedPhoneNumber?.length && phoneNumber?.length > 0;
      if (this.state.selectedCountry?.fixedValue && unmaskedPhoneNumber == this.state.selectedCountry?.fixedValue) {
        isVerified = true
        phoneNumber = phoneNumber + ")"
      }
      this.props.onChangeText({ dialCode, unmaskedPhoneNumber, phoneNumber, isVerified, selectedCountry, fixedValue: selectedCountry?.fixedValue });
    }
  }

  onChangeText = (value: string) => {
    let unmaskedPhoneNumber = (value.match(/\d+/g) || []).join('');
    if (this?.state?.selectedCountry?.fixedValue) {
      if (value?.length <= (this?.state?.selectedCountry?.fixedValue ?? "")?.length) {
        unmaskedPhoneNumber = this?.state?.selectedCountry?.fixedValue ?? ""
      } else {
        if (!unmaskedPhoneNumber?.startsWith(this?.state?.selectedCountry?.fixedValue ?? "")) {
          return
        }
      }
    }

    if (unmaskedPhoneNumber.length === 0) {
      this.setState({ phoneNumber: '' });
      this.onChangePropText('', '');
      return;
    }

    let phoneNumber = this.state.mask.replace(/9/g, '_');
    for (let index = 0; index < unmaskedPhoneNumber.length; index += 1) {
      phoneNumber = phoneNumber.replace('_', unmaskedPhoneNumber[index]);
    }
    let numberPointer = 0;
    for (let index = phoneNumber.length; index > 0; index -= 1) {
      //@ts-ignore
      if (phoneNumber[index] !== ' ' && !isNaN(phoneNumber[index])) {
        numberPointer = index;
        break;
      }
    }

    phoneNumber = phoneNumber.slice(0, numberPointer + 1);

    unmaskedPhoneNumber = (phoneNumber.match(/\d+/g) || []).join('');

    this.onChangePropText(unmaskedPhoneNumber, phoneNumber);

  }

  showModal = () => this.setState({ modalVisible: true });

  hideModal = () => {
    this.data = [...data]
    this.setState({ modalVisible: false })
  };

  onCountryChange = async (country: ICountry) => {
    //   if (dialCode.includes('+1')) {
    //     // let fixedNumber = dialCode.replace("+1", "+")
    //     dialCode = "+1"
    //     // if (getValues(name + "_fixedNumber") != fixedNumber)
    //     //     setValue(name + "_fixedNumber", fixedNumber)
    // }
    try {
      this.setState({
        dialCode: country.dialCode?.includes('+1') ? "+1" : country.dialCode,
        flag: country.flag,
        mask: country.mask,
        phoneNumber: '',
        selectedCountry: country
      }, () => {
        this.onChangeText("")
      });
      this.hideModal();
    } catch (err) {
      const defaultCountry = this.state.defaultCountry;
      this.setState({
        dialCode: country.dialCode?.includes('+1') ? "+1" : country.dialCode,
        flag: defaultCountry.flag,
        mask: defaultCountry.mask,
        phoneNumber: '',
        selectedCountry: defaultCountry
      });
    }
  }

  filterCountries = (value: string) => {
    if (value?.trim()) {
      const { lang } = this.props;
      //@ts-ignore
      const countryData = data.filter((obj) => (obj[lang?.toLowerCase() ?? "en"]?.indexOf(value) > -1 || obj.dialCode.indexOf(value) > -1));
      this.data = _.uniqBy(countryData, 'code')
      this.setState({ isFilter: true });
    } else {
      this.data = [...data]
      this.setState({ isFilter: false });
    }
  }

  focus() {
    this.props.inputRef.current.focus();
  }

  renderModal = () => {
    const {
      countryModalStyle,
      modalContainer,
      filterInputStyleContainer,
      modalFlagStyle,
      filterInputStyle,
      modalCountryItemCountryNameStyle,
      modalCountryItemCountryDialCodeStyle,
      filterText,
      searchIconStyle,
      lang,
      placeholderTextColor
    } = this.props;

    return (
      <Modal onRequestClose={() => this.hideModal()} animationType="slide" transparent={false} visible={this.state.modalVisible}>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={[styles.modalContainer, modalContainer]}>
              <View style={[styles.filterInputStyleContainer, filterInputStyleContainer]}>
                <TouchableOpacity onPress={() => this.hideModal()} style={{ paddingHorizontal: 15, paddingVertical: 10 }} >
                  <Image style={{ height: 22, width: 12, resizeMode: 'contain', marginRight: 0 }} source={require('./ic_left.png')} />
                </TouchableOpacity>
                <TextInput
                  autoFocus
                  onChangeText={this.filterCountries}
                  placeholder={filterText || 'Filter'}
                  style={[styles.filterInputStyle, filterInputStyle]}
                  placeholderTextColor={placeholderTextColor}
                />
                <Text style={[styles.searchIconStyle, searchIconStyle]}>🔍</Text>
              </View>
              <FlatList
                style={{ flex: 1 }}
                data={this.data}
                keyboardShouldPersistTaps={'always'}
                contentContainerStyle={{ paddingVertical: 15, paddingHorizontal: 15 }}
                keyExtractor={(item, index) => index.toString()}
                renderItem={
                  ({ item }) => (
                    <TouchableWithoutFeedback onPress={() => this.onCountryChange(item)}>
                      <View style={[styles.countryModalStyle, countryModalStyle]}>
                        <Text style={[styles.modalFlagStyle, modalFlagStyle]}>{item.flag}</Text>
                        <View style={styles.modalCountryItemContainer}>
                          {/** @ts-ignore */}
                          <Text style={[styles.modalCountryItemCountryNameStyle, modalCountryItemCountryNameStyle]}>{item[lang?.toLowerCase() ?? "en"]}</Text>
                          <Text style={[styles.modalCountryItemCountryDialCodeStyle, modalCountryItemCountryDialCodeStyle]}>{`  ${item.dialCode}`}</Text>
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  )
                }
              />
            </View>
            {/* <TouchableOpacity onPress={() => this.hideModal()} style={[styles.closeButtonStyle, closeButtonStyle]}>
            <Text style={styles.closeTextStyle}>{closeText || 'CLOSE'}</Text>
          </TouchableOpacity> */}
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    );
  }

  render() {
    const { flag } = this.state;
    const {
      containerStyle,
      flagStyle,
      phoneInputStyle,
      dialCodeTextStyle,
      inputProps,
      placeholderTextColor,
      onSubmitEditing = () => null
    } = this.props;
    return (
      <View style={{ ...styles.container, ...containerStyle }}>
        <TouchableOpacity onPress={() => this.showModal()}>
          <View style={styles.openDialogView}>
            <Text style={[styles.flagStyle, flagStyle]}>{flag}</Text>
            <Text style={[styles.dialCodeTextStyle, dialCodeTextStyle]}>{this.state.dialCode}</Text>
          </View>
        </TouchableOpacity>
        {this.renderModal()}
        <TextInput
          {...inputProps}
          ref={this.props?.inputRef}
          style={[styles.phoneInputStyle, phoneInputStyle]}
          placeholder={inputProps?.placeholder || (this.props?.maskPlaceholder ? this.state.mask.replace(/9/g, '#') : "")}
          autoCorrect={false}
          onSubmitEditing={() => {
            Keyboard.dismiss
            onSubmitEditing()
          }}
          keyboardType="number-pad"
          secureTextEntry={false}
          value={this.state.phoneNumber}
          onChangeText={this.onChangeText}
          placeholderTextColor={placeholderTextColor}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  closeTextStyle: {
    padding: 5,
    fontSize: 20,
    color: 'black',
    fontWeight: '600'
  },
  modalCountryItemCountryDialCodeStyle: {
    fontSize: 15,
    color: '#061D32'
  },
  modalCountryItemCountryNameStyle: {
    flex: 1,
    fontSize: 15,
    color: '#061D32'
  },
  modalCountryItemContainer: {
    flex: 1,
    paddingLeft: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalFlagStyle: {
    fontSize: 30,
    marginRight: 7,
    color: 'black'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white'
  },
  flagStyle: {
    fontSize: 35,
    color: "black"
  },
  dialCodeTextStyle: {
    color: "#061D32"
  },
  countryModalStyle: {
    flex: 1,
    borderColor: '#f5f5f5',
    borderTopWidth: 1,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  openDialogView: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  filterInputStyle: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 40,
    marginEnd: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    color: 'black',
    // elevation: 3,
  },
  searchIcon: {
    padding: 10,
  },
  filterInputStyleContainer: {
    width: '100%',
    marginEnd: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 5,
    elevation: 3,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  phoneInputStyle: {
    marginLeft: 5,
    flex: 1
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    padding: 5,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  searchIconStyle: {
    color: 'black',
    fontSize: 16,
    right: 35,
    position: 'absolute'
  },
  buttonStyle: {
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    borderRadius: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  countryStyle: {
    flex: 1,
    borderColor: 'black',
    borderTopWidth: 1,
    padding: 12,
  },
  closeButtonStyle: {
    // padding: 12,
    backgroundColor: 'red',
    alignItems: 'center',
  }
});
