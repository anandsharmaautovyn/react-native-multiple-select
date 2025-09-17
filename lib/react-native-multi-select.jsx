import { Component } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import styles, { colorPack } from './styles';
import { vh } from '@utils';
import { Text, TextInput } from '@components';

const defaultSearchIcon = (
  <Icon
    name="search"
    size={vh(14)}
    color={colorPack.placeholderTextColor}
    style={{ marginRight: 10 }}
  />
);

export default class MultiSelect extends Component {
  static defaultProps = {
    single: false,
    selectedItems: [],
    uniqueKey: '_id',
    tagBorderColor: colorPack.primary,
    tagTextColor: colorPack.primary,
    fontFamily: '',
    tagRemoveIconColor: colorPack.danger,
    selectedItemFontFamily: '',
    selectedItemTextColor: colorPack.primary,
    searchIcon: defaultSearchIcon,
    itemFontFamily: '',
    itemTextColor: colorPack.textPrimary,
    itemFontSize: 16,
    selectedItemIconColor: colorPack.primary,
    searchInputPlaceholderText: 'Search',
    searchInputStyle: { color: colorPack.textPrimary },
    textColor: colorPack.textPrimary,
    selectText: 'Select',
    altFontFamily: '',
    hideSubmitButton: false,
    submitButtonColor: '#CCC',
    submitButtonText: 'Submit',
    fontSize: 14,
    fixedHeight: false,
    hideTags: false,
    hideDropdown: false,
    onChangeInput: () => {},
    displayKey: 'name',
    canAddItems: false,
    onAddItem: () => {},
    onClearSelector: () => {},
    onToggleList: () => {},
    removeSelected: false,
    noItemsText: 'No items to display.',
    selectedText: 'selected'
  };

  constructor(props) {
    super(props);
    this.state = {
      selector: false,
      searchTerm: ''
    };
  }

  shouldComponentUpdate() {
    return true;
  }

  _onChangeInput = (text) => {
    this.props.onChangeInput?.(text);
    this.setState({ searchTerm: text });
  };

  _getSelectLabel = () => {
    const { selectText, single, selectedItems, displayKey, selectedText } = this.props;
    if (!selectedItems.length) return selectText;
    if (single) {
      const item = this._findItem(selectedItems[0]);
      return item?.[displayKey] ?? selectText;
    }
    return `${selectText} (${selectedItems.length} ${selectedText})`;
  };

  _findItem = itemKey => {
    const { items, uniqueKey } = this.props;
    return items.find((item) => item[uniqueKey] === itemKey) || {};
  };

  _displaySelectedItems = optionalSelectedItems => {
    const {
      fontFamily,
      tagContainerStyle,
      tagRemoveIconColor,
      tagBorderColor,
      uniqueKey,
      tagTextColor,
      selectedItems,
      displayKey,
      styleTextTag
    } = this.props;
    const actualSelectedItems = optionalSelectedItems || selectedItems;
    return actualSelectedItems.map(singleSelectedItem => {
      const item = this._findItem(singleSelectedItem);
      if (!item[displayKey]) return null;
      return (
        <View
          style={[
            styles.selectedItem,
            {
              width: item[displayKey].length * 8 + 60,
              justifyContent: 'center',
              height: 40,
              borderColor: tagBorderColor
            },
            tagContainerStyle || {}
          ]}
          key={item[uniqueKey]}
        >
          <Text
            style={[
              {
                flex: 1,
                color: tagTextColor,
                fontSize: 15
              },
              styleTextTag && styleTextTag,
              fontFamily ? { fontFamily } : {}
            ]}
            numberOfLines={1}
          >
            {item[displayKey]}
          </Text>
          <TouchableOpacity onPress={() => this._removeItem(item)}>
            <Icon
              name="close-circle"
              size={22}
              color={tagRemoveIconColor}
              style={{ marginLeft: 10 }}
            />
          </TouchableOpacity>
        </View>
      );
    });
  };

  _removeItem = (item) => {
    const { uniqueKey, selectedItems, onSelectedItemsChange } = this.props;
    const updated = selectedItems.filter((id) => id !== item[uniqueKey]);
    onSelectedItemsChange(updated);
  };

  _clearSelectorCallback = () => {
    this.setState({ selector: false });
    this.props.onClearSelector?.();
  };

  _toggleSelector = () => {
    const { onToggleList } = this.props;
    this.setState({
      selector: !this.state.selector
    });
    if (onToggleList) {
      onToggleList();
    }
  };

  _clearSearchTerm = () => {
    this.setState({ searchTerm: '' });
  };

  _submitSelection = () => {
    this.setState({ selector: false });
    this._clearSearchTerm();
  };

  _itemSelected = (item) => {
    return this.props.selectedItems.includes(item[this.props.uniqueKey]);
  };

  _addItem = () => {
    const {
      uniqueKey,
      items,
      selectedItems,
      onSelectedItemsChange,
      onAddItem
    } = this.props;
    const { searchTerm } = this.state;
    if (!searchTerm) return;

    const newItemId = searchTerm.trim().split(' ').join('-');
    const newItem = { [uniqueKey]: newItemId, name: searchTerm };

    onAddItem([...items, newItem]);
    onSelectedItemsChange([...selectedItems, newItemId]);
    this._clearSearchTerm();
  };

  _toggleItem = item => {
    const {
      single,
      uniqueKey,
      selectedItems,
      onSelectedItemsChange
    } = this.props;
    const key = item[uniqueKey];
    if (single) {
      this._submitSelection();
      onSelectedItemsChange([key]);
    } else {
      const updated = selectedItems.includes(key)
        ? selectedItems.filter((id) => id !== key)
        : [...selectedItems, key];
      onSelectedItemsChange(updated);
    }
  };

  _findMatchingItems = () => {
    const { searchTerm } = this.state;
    const { items, displayKey, removeSelected, selectedItems, uniqueKey, filterMethod } = this.props;

    let filtered = items;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      if (filterMethod === 'full') {
        filtered = items.filter((item) =>
          (item?.[displayKey] ?? '').toLowerCase().includes(term)
        );
      } else {
        const parts = term.split(/[ \-:]+/);
        const regex = new RegExp(`(${parts.join('|')})`, 'ig');
        filtered = items.filter((item) =>
          regex.test(item?.[displayKey] ?? '')
        );
      }
    }

    if (removeSelected) {
      filtered = filtered.filter((item) => !selectedItems.includes(item[uniqueKey]));
    }

    return filtered;
  };

  _getRow = (item) => {
    const {
      selectedItemIconColor,
      displayKey,
      styleRowList,
      selectedItemTextColor,
      itemTextColor,
      selectedItemFontFamily,
      itemFontFamily,
    } = this.props;
    const isSelected = this._itemSelected(item);
    return (
      <TouchableOpacity
        key={item[this.props.uniqueKey]}
        disabled={item.disabled}
        onPress={() => this._toggleItem(item)}
        style={[styleRowList, { paddingLeft: 20, paddingRight: 20 }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              flex: 1,
              fontSize: 16,
              paddingVertical: 5,
              color: isSelected ? selectedItemTextColor : itemTextColor,
              fontFamily: isSelected ? selectedItemFontFamily : itemFontFamily,
              ...(item.disabled ? { color: 'grey' } : {}),
            }}
            // numberOfLines={1}
          >
            {item[displayKey]}
          </Text>
          {isSelected && (
            <Icon name="checkmark" size={20} color={selectedItemIconColor} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  _getRowNew = item => (
    <TouchableOpacity
      onPress={() => this._addItem(item)}
      style={{ paddingLeft: 20, paddingRight: 20 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          style={{
            flex: 1,
            fontSize: 16,
            paddingVertical: 5,
            color: this.props.itemTextColor,
            fontFamily: this.props.itemFontFamily,
          }}
        >
          Add {item.name} (tap or press return)
        </Text>
      </View>
    </TouchableOpacity>
  );


  _renderItems = () => {
    const {
      canAddItems,
      fontFamily,
      uniqueKey,
      selectedItems,
      flatListProps,
      displayKey,
      styleListContainer,
      noItemsText
    } = this.props;

    const { searchTerm } = this.state;
    const matched = this._findMatchingItems();

    const showAddItem =
      canAddItems &&
      searchTerm &&
      !matched.some((item) => item[displayKey] === searchTerm);

    return (
      <View style={styleListContainer}>
        {matched.length ? (
          <FlatList
            data={matched}
            extraData={selectedItems}
            keyExtractor={(item, index) => item[uniqueKey]?.toString() ?? index.toString()}
            renderItem={({ item }) => this._getRow(item)}
            nestedScrollEnabled
            {...flatListProps}
          />
        ) : (
          <Text
            style={{
              textAlign: 'center',
              marginTop: 20,
              color: colorPack.danger,
              fontFamily,
            }}
          >
            {noItemsText}
          </Text>
        )}
        {showAddItem && this._getRowNew({ name: searchTerm })}
      </View>
    );
  };

  render() {
    const {
      selectedItems,
      single,
      fontFamily,
      altFontFamily,
      searchInputPlaceholderText,
      searchInputStyle,
      styleDropdownMenu,
      styleDropdownMenuSubsection,
      hideSubmitButton,
      hideDropdown,
      submitButtonColor,
      submitButtonText,
      fontSize,
      textColor,
      fixedHeight,
      hideTags,
      textInputProps,
      styleMainWrapper,
      styleInputGroup,
      styleItemsContainer,
      styleSelectorContainer,
      styleTextDropdown,
      styleTextDropdownSelected,
      searchIcon,
      styleIndicator,
      canAddItem,
    } = this.props;
    const { searchTerm, selector } = this.state;
    return (
      <View style={[{ flexDirection: 'column' }, styleMainWrapper]}>
        {selector ? (
          <View style={[styles.selectorView(fixedHeight), styleSelectorContainer]}>
            <View style={[styles.inputGroup, styleInputGroup]}>
              {searchIcon}
              <TextInput
                autoFocus
                onChangeText={this._onChangeInput}
                onSubmitEditing={canAddItem && this._addItem}
                placeholder={searchInputPlaceholderText}
                placeholderTextColor={colorPack.placeholderTextColor}
                underlineColorAndroid="transparent"
                style={[searchInputStyle, { flex: 1 }]}
                value={searchTerm}
                {...textInputProps}
              />
              {hideSubmitButton && (
                <TouchableOpacity onPress={this._submitSelection}>
                  <Icon
                    name="chevron-up-outline"
                    style={[styles.indicator, styleIndicator, { paddingHorizontal: 15 }]}
                  />
                </TouchableOpacity>
              )}
              {!hideDropdown && (
                <Icon
                  name="arrow-back"
                  size={vh(20)}
                  onPress={this._clearSelectorCallback}
                  color={colorPack.placeholderTextColor}
                  style={{ marginLeft: 5 }}
                />
              )}
            </View>
            <View style={{ backgroundColor: '#fafafa' }}>

              <View style={styleItemsContainer && styleItemsContainer}>
                {this._renderItems()}
              </View>
              {!single && !hideSubmitButton && (
                <TouchableOpacity
                  onPress={this._submitSelection}
                  style={[styles.button, { backgroundColor: submitButtonColor }]}
                >
                  <Text style={[styles.buttonText, fontFamily ? { fontFamily } : {}]}>
                    {submitButtonText}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <TouchableWithoutFeedback onPress={this._toggleSelector}>
            <View style={[styles.dropdownView, styleDropdownMenu]}>
              <View
                style={[
                  styles.subSection,
                  { paddingVertical: 10 },
                  styleDropdownMenuSubsection,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={
                    !selectedItems.length
                      ? [
                          {
                            flex: 1,
                            fontSize,
                            color: textColor || colorPack.placeholderTextColor,
                          },
                          styleTextDropdown,
                          altFontFamily
                            ? { fontFamily: altFontFamily }
                            : fontFamily
                            ? { fontFamily }
                            : {},
                        ]
                      : [
                          {
                            flex: 1,
                            fontSize,
                            color: textColor || colorPack.placeholderTextColor,
                          },
                          styleTextDropdownSelected,
                        ]
                  }
                >
                  {this._getSelectLabel()}
                </Text>
                <Icon
                  name={hideSubmitButton ? 'chevron-down-outline' : 'chevron-up-outline'}
                  style={[styles.indicator, styleIndicator]}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
        {!single && !hideTags && selectedItems.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {this._displaySelectedItems()}
          </View>
        )}
      </View>
    );
  }
}
