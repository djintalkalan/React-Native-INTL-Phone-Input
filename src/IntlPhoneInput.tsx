import React, { FC } from 'react';
import { ColorValue, FlatList, Keyboard, Modal, SafeAreaView, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import countries from './Countries';

interface IntlPhoneInputProps {
  lang?: string,
  defaultCountry?: string,
  mask?: string,
  onChangeText: (data: IOnChangeText) => void,
  customModal?: (modalVisible: boolean, countryData: any, onCountryChange: (code: string) => void) => FC,
  phoneInputStyle?: any, // {}
  containerStyle?: any, // {}
  maskPlaceholder?: boolean
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
    data = [...(props?.disableDefaultCountries && props?.extraCountries?.length ? [] : data), ...(props?.extraCountries ?? [])]?.sort((a, b) => compare(a, b, props?.lang || "en"))
    DEFAULT_COUNTRY = data[0]
    if (props?.dialCode) {
      defaultCountry = data.filter((obj) => obj.dialCode == props.dialCode)[0] || data.filter((obj) => obj.dialCode === '+91')[0];
    } else {
      defaultCountry = data.filter((obj) => obj.code === props.defaultCountry)[0] || data.filter((obj) => obj.code === 'IN')[0];
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
    if (props.dialCode != this.props.dialCode) {
      const defaultCountry = (data.filter((obj) => obj.dialCode == this.props.dialCode)[0] || data.filter((obj) => obj.dialCode === '+91')?.[0]) ?? DEFAULT_COUNTRY;
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

  hideModal = () => this.setState({ modalVisible: false });

  onCountryChange = async (code) => {
    const countryData = data;
    try {
      const country = countryData.filter((obj) => obj.code === code)[0];
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
    this.setState({ countryData });
  }

  focus() {
    this.props.inputRef.current.focus();
  }

  renderModal = () => {
    if (this.props.customModal) return this.props.customModal(this.state.modalVisible, this.state.countryData, this.onCountryChange);
    const {
      countryModalStyle,
      modalContainer,
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
      <Modal animationType="slide" transparent={false} visible={this.state.modalVisible}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[styles.modalContainer, modalContainer]}>
            <View style={styles.filterInputStyleContainer}>
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
              keyExtractor={(item, index) => index.toString()}
              renderItem={
                ({ item }) => (
                  <TouchableWithoutFeedback onPress={() => this.onCountryChange(item.code)}>
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
          <TouchableOpacity onPress={() => this.hideModal()} style={[styles.closeButtonStyle, closeButtonStyle]}>
            <Text style={styles.closeTextStyle}>{closeText || 'CLOSE'}</Text>
          </TouchableOpacity>
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
          placeholder={inputProps?.placeholder || (this.props?.maskPlaceholder ? this.state.mask.replace(/9/g, '_') : "")}
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
    fontWeight: 'bold'
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
    flexDirection: 'row'
  },
  modalFlagStyle: {
    fontSize: 25,
  },
  modalContainer: {
    paddingTop: 15,
    paddingLeft: 25,
    paddingRight: 25,
    flex: 10,
    backgroundColor: 'white'
  },
  flagStyle: {
    fontSize: 35,
  },
  dialCodeTextStyle: {
  },
  countryModalStyle: {
    flex: 1,
    borderColor: 'black',
    borderTopWidth: 1,
    padding: 12,
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
    backgroundColor: '#fff',
    color: '#424242',
  },
  searchIcon: {
    padding: 10,
  },
  filterInputStyleContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
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
    fontSize: 15,
    marginLeft: 15
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
    padding: 12,
    alignItems: 'center',
  }
});