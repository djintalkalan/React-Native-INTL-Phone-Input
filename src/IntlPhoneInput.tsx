import _ from 'lodash';
import React, { FC } from 'react';
import { ColorValue, FlatList, Image, Keyboard, Modal, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import countries from './Countries';

interface IntlPhoneInputProps {
  lang?: string,
  defaultCountry?: string,
  mask?: string,
  onChangeText: (data: IOnChangeText) => void,
  customModal?: (modalVisible: boolean, countryData: any, onCountryChange: (item: ICountry) => void) => FC,
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
  inputRef?: any,
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
  sortBy?: "lang" | 'code' | 'dialCode'
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

let data = countries;

const compare = (a: ICountry, b: ICountry, lang: string) => {
  const aName = a[lang] || ""
  const bName = b[lang] || ""
  return aName < bName ? -1 : aName > bName ? 1 : 0;
}

let DEFAULT_COUNTRY = { ru: "Соединенные Штаты", lt: "Jungtinės Valstijos", tr: "Amerika Birleşik Devletleri", en: 'United States', flag: '🇺🇸', code: 'US', dialCode: '+1', mask: '(999) 999-9999' }

export default class IntlPhoneInput extends React.Component<IntlPhoneInputProps, IntlPhoneInputState> {
  constructor(props: IntlPhoneInputProps) {
    super(props);
    let defaultCountry
    data = [...(props?.disableDefaultCountries && props?.extraCountries?.length ? [] : data), ...(props?.extraCountries ?? [])]?.sort((a, b) => compare(a, b, !props?.sortBy ? "en" : props?.sortBy == 'lang' ? (props?.lang || "en") : props?.sortBy))
    DEFAULT_COUNTRY = data[0]
    if (props?.dialCode) {
      defaultCountry = data.filter((obj) => obj.dialCode == props.dialCode)[0] || data.filter((obj) => obj.dialCode === '+1')[0];
    } else {
      defaultCountry = data.filter((obj) => obj.code === props.defaultCountry)[0] || data.filter((obj) => obj.code === 'US')[0];
    }
    if (!defaultCountry) {
      defaultCountry = DEFAULT_COUNTRY
    }
    this.state = {
      defaultCountry,
      flag: defaultCountry?.flag,
      modalVisible: false,
      dialCode: defaultCountry.dialCode,
      phoneNumber: props.selectedPhone,
      mask: props.mask || defaultCountry.mask,
      countryData: data,
      selectedCountry: defaultCountry,
      placeholderTextColor: 'grey'
    };
  }

  componentDidUpdate(props: IntlPhoneInputProps, state: IntlPhoneInputState) {
    if (props.selectedPhone != this.props.selectedPhone) {
      this.setState({ phoneNumber: this.props.selectedPhone })
    }
    if (props?.dialCode != this.props?.dialCode || props?.defaultCountry != this.props?.defaultCountry) {
      const defaultCountry = (data.filter((obj) => !this.props?.dialCode ? (obj?.code == this.props?.defaultCountry) : (obj?.dialCode == this.props?.dialCode))[0] || data.filter((obj) => obj.dialCode === '+1')?.[0]) ?? DEFAULT_COUNTRY;
      this.setState({
        defaultCountry,
        flag: defaultCountry.flag,
        modalVisible: false,
        dialCode: defaultCountry.dialCode,
        mask: this.props.mask || defaultCountry.mask,
        selectedCountry: defaultCountry,
        placeholderTextColor: 'grey'
      }, () => {
      })
    }
  }

  onChangePropText = (unmaskedPhoneNumber, phoneNumber) => {
    const { dialCode, mask, selectedCountry } = this.state;
    const countOfNumber = mask.match(/9/g).length;
    if (this.props.onChangeText) {
      const isVerified = countOfNumber === unmaskedPhoneNumber?.length && phoneNumber?.length > 0;
      this.props.onChangeText({
        dialCode, unmaskedPhoneNumber, phoneNumber, isVerified, selectedCountry
      });
    }
  }

  onChangeText = (value) => {
    let unmaskedPhoneNumber = (value.match(/\d+/g) || []).join('');

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
    this.setState({ phoneNumber });
  }


  showModal = () => (this.props.disableCountryChange ? null : this.setState({ modalVisible: true }));

  hideModal = () => this.setState({ modalVisible: false, countryData: data });

  onCountryChange = async (country: ICountry) => {
    try {
      this.setState({
        dialCode: country.dialCode,
        flag: country.flag,
        mask: this.props.mask || country.mask,
        phoneNumber: '',
        selectedCountry: country
      });
      this.hideModal();
    } catch (err) {
      const defaultCountry = this.state.defaultCountry;
      this.setState({
        dialCode: defaultCountry.dialCode,
        flag: defaultCountry.flag,
        mask: this.props.mask || defaultCountry.mask,
        phoneNumber: '',
        selectedCountry: defaultCountry
      });
    }
  }

  filterCountries = (value) => {
    const { lang } = this.props;
    const countryData = data.filter((obj) => (obj[lang?.toLowerCase() ?? "en"]?.indexOf(value) > -1 || obj.dialCode.indexOf(value) > -1));
    this.setState({ countryData: _.uniqBy(countryData, 'code') });
  }

  focus() {
    this.props.inputRef.current.focus();
  }

  renderModal = () => {
    if (this.props.customModal) return this.props.customModal(this.state.modalVisible, this.state.countryData, this.onCountryChange);
    const {
      countryModalStyle,
      modalContainer,
      filterInputStyleContainer,
      modalFlagStyle,
      filterInputStyle,
      modalCountryItemCountryNameStyle,
      modalCountryItemCountryDialCodeStyle,
      closeText,
      filterText,
      searchIconStyle,
      closeButtonStyle,
      lang,
      placeholderTextColor
    } = this.props;

    return (
      <Modal onRequestClose={() => this.hideModal()} animationType="slide" transparent={false} visible={this.state.modalVisible}>
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
              data={this.state.countryData}
              contentContainerStyle={{ paddingVertical: 15, paddingHorizontal: 15 }}
              keyExtractor={(item, index) => index.toString()}
              renderItem={
                ({ item }) => (
                  <TouchableWithoutFeedback onPress={() => this.onCountryChange(item)}>
                    <View style={[styles.countryModalStyle, countryModalStyle]}>
                      <Text style={[styles.modalFlagStyle, modalFlagStyle]}>{item.flag}</Text>
                      <View style={styles.modalCountryItemContainer}>
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
      </Modal>
    );
  }

  renderAction = () => {
    const renderAction = this.props.renderAction;
    if (renderAction) {
      console.log("action", renderAction);
      if (typeof renderAction !== "function") throw ("The renderAction is not a function. Please set a renderAction function on there");
      else return this.props.renderAction();
    }
    return null;
  }


  render() {
    const { flag } = this.state;
    const {
      containerStyle,
      flagStyle,
      phoneInputStyle,
      dialCodeTextStyle,
      inputProps,
      placeholderTextColor
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
          returnKeyLabel='Done'
          returnKeyType='done'
          onSubmitEditing={Keyboard.dismiss}
          keyboardType="number-pad"
          secureTextEntry={false}
          value={this.state.phoneNumber}
          onChangeText={this.onChangeText}
          placeholderTextColor={placeholderTextColor}
        />
        {this.renderAction()}

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
    fontSize: 15
  },
  modalCountryItemCountryNameStyle: {
    flex: 1,
    fontSize: 15
  },
  modalCountryItemContainer: {
    flex: 1,
    paddingLeft: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalFlagStyle: {
    fontSize: 30,
    marginRight: 7
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white'
  },
  flagStyle: {
    fontSize: 35,
  },
  dialCodeTextStyle: {
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