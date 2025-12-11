'use client';

import { useState, useEffect, useMemo } from 'react';

// Types for restaurant menu
interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface Menu {
  id: string;
  title: string;
  items: MenuItem[];
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  menus?: Menu[];
}

// Order item with assigned members
interface OrderItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[]; // member userIds
  isCustom: boolean;
}

interface PreOrderProps {
  restaurant: Restaurant;
  members: Array<{ 
    id: string; 
    username: string; 
    allergies?: string[];
    dietaryRestrictions?: string[];
  }>;
  onClose: () => void;
  onSave?: (order: OrderItem[], tip: number, taxRate: number) => void;
  initialOrder?: {
    items: OrderItem[];
    tipPercent: number;
    taxRate: number;
  };
}

export default function PreOrder({ restaurant, members, onClose, onSave, initialOrder }: PreOrderProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialOrder?.items || []);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [tipPercent, setTipPercent] = useState<number>(initialOrder?.tipPercent || 18);
  const [taxRate, setTaxRate] = useState<number>(initialOrder?.taxRate || 0.0875);
  const [isLoadingTax, setIsLoadingTax] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showMemberSelect, setShowMemberSelect] = useState(false);
  const [pendingItem, setPendingItem] = useState<{ name: string; price: number } | null>(null);

  // Get all allergies from members
  const allAllergies = useMemo(() => {
    const allergiesMap: Record<string, string[]> = {};
    members.forEach(member => {
      if (member.allergies && member.allergies.length > 0) {
        allergiesMap[member.username] = member.allergies;
      }
    });
    return allergiesMap;
  }, [members]);

  // Extract zip code from restaurant address
  const zipCode = useMemo(() => {
    const match = restaurant.address.match(/\b(\d{5})\b/);
    return match ? match[1] : '94704'; // Default to Berkeley
  }, [restaurant.address]);

  // Fetch tax rate on mount (only if no initial order with taxRate)
  useEffect(() => {
    // Skip fetching if we have an initial order with a tax rate
    if (initialOrder?.taxRate) return;
    
    const fetchTaxRate = async () => {
      setIsLoadingTax(true);
      try {
        const response = await fetch(`/api/tax-rate?zipCode=${zipCode}`);
        const data = await response.json();
        if (data.taxRate) {
          setTaxRate(data.taxRate);
        }
      } catch (error) {
        console.error('Error fetching tax rate:', error);
      } finally {
        setIsLoadingTax(false);
      }
    };
    fetchTaxRate();
  }, [zipCode, initialOrder?.taxRate]);

  // Set default category
  useEffect(() => {
    if (restaurant.menus && restaurant.menus.length > 0 && !selectedCategory) {
      setSelectedCategory(restaurant.menus[0].id);
    }
  }, [restaurant.menus, selectedCategory]);

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.price, 0);
    const tax = subtotal * taxRate;
    const tip = subtotal * (tipPercent / 100);
    const total = subtotal + tax + tip;

    // Calculate per-member costs
    const memberCosts: Record<string, number> = {};
    members.forEach(m => {
      memberCosts[m.id] = 0;
    });

    orderItems.forEach(item => {
      if (item.assignedTo.length > 0) {
        const perPersonCost = item.price / item.assignedTo.length;
        item.assignedTo.forEach(memberId => {
          memberCosts[memberId] = (memberCosts[memberId] || 0) + perPersonCost;
        });
      }
    });

    // Add proportional tax and tip to each member
    Object.keys(memberCosts).forEach(memberId => {
      if (subtotal > 0) {
        const proportion = memberCosts[memberId] / subtotal;
        memberCosts[memberId] += (tax + tip) * proportion;
      }
    });

    return { subtotal, tax, tip, total, memberCosts };
  }, [orderItems, taxRate, tipPercent, members]);

  const handleAddMenuItem = (item: MenuItem) => {
    setPendingItem({ name: item.name, price: item.price });
    setSelectedMembers([]);
    setShowMemberSelect(true);
  };

  const handleConfirmOrder = () => {
    if (pendingItem && selectedMembers.length > 0) {
      const newItem: OrderItem = {
        id: `${Date.now()}-${Math.random()}`,
        name: pendingItem.name,
        price: pendingItem.price,
        assignedTo: selectedMembers,
        isCustom: false,
      };
      setOrderItems([...orderItems, newItem]);
      setPendingItem(null);
      setSelectedMembers([]);
      setShowMemberSelect(false);
    }
  };

  const handleAddCustomItem = () => {
    const price = parseFloat(customItemPrice);
    if (customItemName && !isNaN(price) && price > 0 && selectedMembers.length > 0) {
      const newItem: OrderItem = {
        id: `custom-${Date.now()}-${Math.random()}`,
        name: customItemName,
        price: price,
        assignedTo: selectedMembers,
        isCustom: true,
      };
      setOrderItems([...orderItems, newItem]);
      setCustomItemName('');
      setCustomItemPrice('');
      setSelectedMembers([]);
      setShowCustomForm(false);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const currentMenu = restaurant.menus?.find(m => m.id === selectedCategory);

  return (
    <div 
      className="preorder-modal fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div 
        className="preorder-content rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: '#ffffff', color: '#171717' }}
      >
        {/* Header with allergy info */}
        <div 
          className="p-4 flex justify-between items-start"
          style={{ borderBottom: '1px solid #e5e7eb' }}
        >
          <div>
            <h2 className="preorder-title text-xl font-bold" style={{ color: '#171717' }}>Pre-Order for {restaurant.name}</h2>
            <p className="preorder-subtitle text-sm" style={{ color: '#6b7280' }}>{restaurant.address}</p>
          </div>
          
          {/* Allergy Warning - Red badge in top right */}
          {Object.keys(allAllergies).length > 0 && (
            <div 
              className="preorder-allergy-alert rounded-lg p-3 max-w-xs"
              style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚠️</span>
                <span className="preorder-allergy-title font-semibold text-sm" style={{ color: '#b91c1c' }}>Allergy Alert</span>
              </div>
              <div className="preorder-allergy-item text-xs" style={{ color: '#dc2626' }}>
                {Object.entries(allAllergies).map(([username, allergies]) => (
                  <div key={username}>
                    <span className="font-medium">{username}:</span> {allergies.join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Menu selection */}
          <div 
            className="preorder-left-panel w-1/2 flex flex-col overflow-hidden"
            style={{ borderRight: '1px solid #e5e7eb' }}
          >
            {/* Category tabs */}
            {restaurant.menus && restaurant.menus.length > 0 && (
              <div 
                className="preorder-category-bar flex gap-2 p-3 overflow-x-auto"
                style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}
              >
                {restaurant.menus.map(menu => (
                  <button
                    key={menu.id}
                    onClick={() => setSelectedCategory(menu.id)}
                    className={`preorder-category-btn px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${selectedCategory === menu.id ? 'active' : ''}`}
                  >
                    {menu.title}
                  </button>
                ))}
              </div>
            )}

            {/* Menu items */}
            <div className="preorder-scrollbar flex-1 overflow-y-auto p-3">
              {currentMenu?.items.map(item => (
                <div
                  key={item.id}
                  className="preorder-menu-item flex justify-between items-center p-3 rounded-lg mb-2 cursor-pointer"
                  style={{ border: '1px solid #e5e7eb' }}
                  onClick={() => handleAddMenuItem(item)}
                >
                  <span className="preorder-item-name" style={{ color: '#171717' }}>{item.name}</span>
                  <span className="preorder-item-price font-medium" style={{ color: '#171717' }}>
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              ))}

              {/* Add custom item button */}
              <button
                onClick={() => {
                  setShowCustomForm(true);
                  setSelectedMembers([]);
                }}
                className="preorder-custom-btn w-full p-3 rounded-lg transition mt-4"
                style={{ border: '2px dashed #d1d5db', color: '#6b7280', backgroundColor: 'transparent' }}
              >
                + Add Custom Item
              </button>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="preorder-right-panel w-1/2 flex flex-col overflow-hidden">
            <div 
              className="preorder-order-header p-3"
              style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}
            >
              <h3 className="preorder-order-title font-semibold" style={{ color: '#171717' }}>Current Order</h3>
            </div>

            {/* Order items list */}
            <div className="preorder-scrollbar flex-1 overflow-y-auto p-3">
              {orderItems.length === 0 ? (
                <p className="preorder-order-empty text-center py-8" style={{ color: '#6b7280' }}>
                  Click on menu items to add to order
                </p>
              ) : (
                orderItems.map(item => (
                  <div 
                    key={item.id} 
                    className="preorder-order-item rounded-lg p-3 mb-2"
                    style={{ border: '1px solid #e5e7eb' }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="preorder-order-item-name font-medium" style={{ color: '#171717' }}>
                          {item.name}
                          {item.isCustom && (
                            <span className="preorder-custom-tag ml-2 text-xs px-1 rounded">
                              Custom
                            </span>
                          )}
                        </span>
                        <div className="preorder-order-item-member text-xs mt-1" style={{ color: '#6b7280' }}>
                          For: {item.assignedTo.map(id => members.find(m => m.id === id)?.username).join(', ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="preorder-order-item-price" style={{ color: '#171717' }}>${item.price.toFixed(2)}</span>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="preorder-remove-btn text-sm"
                          style={{ color: '#ef4444' }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tip and calculations */}
            <div 
              className="preorder-tax-section p-3"
              style={{ borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}
            >
              {/* Tip selector */}
              <div className="flex items-center gap-2 mb-3">
                <span className="preorder-tax-label text-sm" style={{ color: '#374151' }}>Tip:</span>
                {[15, 18, 20, 25].map(percent => (
                  <button
                    key={percent}
                    onClick={() => setTipPercent(percent)}
                    className={`preorder-tip-btn px-2 py-1 rounded text-sm ${tipPercent === percent ? 'active' : ''}`}
                  >
                    {percent}%
                  </button>
                ))}
                <input
                  type="number"
                  value={tipPercent}
                  onChange={(e) => setTipPercent(Math.max(0, parseInt(e.target.value) || 0))}
                  className="preorder-custom-input w-16 px-2 py-1 rounded text-sm"
                  style={{ border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#171717' }}
                  min="0"
                  max="100"
                />
                <span className="preorder-label text-sm" style={{ color: '#374151' }}>%</span>
              </div>

              {/* Totals */}
              <div className="text-sm space-y-1">
                <div className="preorder-subtotal-row flex justify-between" style={{ color: '#374151' }}>
                  <span>Subtotal:</span>
                  <span>${calculations.subtotal.toFixed(2)}</span>
                </div>
                <div className="preorder-subtotal-row flex justify-between" style={{ color: '#374151' }}>
                  <span>Tax ({(taxRate * 100).toFixed(2)}%):</span>
                  <span>${calculations.tax.toFixed(2)}</span>
                  {isLoadingTax && <span className="text-xs ml-1" style={{ color: '#9ca3af' }}>(loading...)</span>}
                </div>
                <div className="preorder-subtotal-row flex justify-between" style={{ color: '#374151' }}>
                  <span>Tip ({tipPercent}%):</span>
                  <span>${calculations.tip.toFixed(2)}</span>
                </div>
                <div 
                  className="preorder-total-row flex justify-between font-bold text-lg pt-2"
                  style={{ color: '#171717', borderTop: '1px solid #e5e7eb' }}
                >
                  <span>Total:</span>
                  <span className="preorder-total-amount">${calculations.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Per-member breakdown */}
              {orderItems.length > 0 && (
                <div className="preorder-breakdown-section mt-4 pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
                  <h4 className="preorder-breakdown-title font-medium text-sm mb-2" style={{ color: '#171717' }}>Per Person:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {members.map(member => (
                      <div 
                        key={member.id} 
                        className="preorder-breakdown-item flex justify-between rounded px-2 py-1"
                        style={{ backgroundColor: '#f3f4f6' }}
                      >
                        <span style={{ color: '#374151' }}>{member.username}:</span>
                        <span className="preorder-breakdown-amount font-medium" style={{ color: '#171717' }}>
                          ${(calculations.memberCosts[member.id] || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="p-4 flex justify-end gap-3"
          style={{ borderTop: '1px solid #e5e7eb' }}
        >
          <button
            onClick={onClose}
            className="preorder-close-btn px-4 py-2 rounded-lg"
            style={{ border: '1px solid #d1d5db', color: '#374151', backgroundColor: '#ffffff' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave?.(orderItems, tipPercent, taxRate)}
            className="preorder-save-btn px-4 py-2 rounded-lg"
            style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
            disabled={orderItems.length === 0}
          >
            Save Order
          </button>
        </div>

        {/* Member selection modal */}
        {showMemberSelect && pendingItem && (
          <div 
            className="preorder-modal absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <div 
              className="preorder-content rounded-lg p-4 w-80"
              style={{ backgroundColor: '#ffffff' }}
            >
              <h3 className="preorder-section-title font-semibold mb-3" style={{ color: '#171717' }}>
                Who is ordering {pendingItem.name}?
              </h3>
              <p className="preorder-label text-sm mb-3" style={{ color: '#6b7280' }}>
                ${pendingItem.price.toFixed(2)} - Select one or more people
              </p>
              <button
                onClick={() => {
                  if (selectedMembers.length === members.length) {
                    setSelectedMembers([]);
                  } else {
                    setSelectedMembers(members.map(m => m.id));
                  }
                }}
                className="preorder-toggle-select-btn w-full px-2 py-1.5 rounded text-sm mb-3 transition-colors"
              >
                {selectedMembers.length === members.length ? 'Deselect All' : 'Select All'}
              </button>
              <div className="space-y-2 mb-4">
                {members.map(member => (
                  <label
                    key={member.id}
                    className="preorder-menu-item flex items-center gap-2 p-2 rounded cursor-pointer"
                    style={{ border: '1px solid #e5e7eb' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => toggleMemberSelection(member.id)}
                      className="rounded"
                    />
                    <span className="preorder-item-name" style={{ color: '#171717' }}>{member.username}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowMemberSelect(false);
                    setPendingItem(null);
                    setSelectedMembers([]);
                  }}
                  className="preorder-dialog-cancel flex-1 px-3 py-2 rounded"
                  style={{ backgroundColor: '#6b7280', color: '#ffffff' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOrder}
                  className="preorder-dialog-add flex-1 px-3 py-2 rounded disabled:opacity-50"
                  style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
                  disabled={selectedMembers.length === 0}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom item form modal */}
        {showCustomForm && (
          <div 
            className="preorder-modal absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <div 
              className="preorder-content rounded-lg p-4 w-80"
              style={{ backgroundColor: '#ffffff' }}
            >
              <h3 className="preorder-section-title font-semibold mb-3" style={{ color: '#171717' }}>Add Custom Item</h3>
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="Item name"
                  className="preorder-custom-input w-full px-3 py-2 rounded"
                  style={{ border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#171717' }}
                />
                <input
                  type="number"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  placeholder="Price"
                  step="0.01"
                  min="0"
                  className="preorder-custom-input w-full px-3 py-2 rounded"
                  style={{ border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#171717' }}
                />
                <div className="pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
                  <p className="preorder-label text-sm mb-2" style={{ color: '#6b7280' }}>Who is ordering?</p>
                  <button
                    onClick={() => {
                      if (selectedMembers.length === members.length) {
                        setSelectedMembers([]);
                      } else {
                        setSelectedMembers(members.map(m => m.id));
                      }
                    }}
                    className="preorder-toggle-select-btn w-full px-2 py-1.5 rounded text-xs mb-2 transition-colors"
                  >
                    {selectedMembers.length === members.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {members.map(member => (
                    <label
                      key={member.id}
                      className="preorder-menu-item flex items-center gap-2 p-2 rounded cursor-pointer mb-1"
                      style={{ border: '1px solid #e5e7eb' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => toggleMemberSelection(member.id)}
                        className="rounded"
                      />
                      <span className="preorder-item-name" style={{ color: '#171717' }}>{member.username}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCustomForm(false);
                    setCustomItemName('');
                    setCustomItemPrice('');
                    setSelectedMembers([]);
                  }}
                  className="preorder-dialog-cancel flex-1 px-3 py-2 rounded"
                  style={{ backgroundColor: '#6b7280', color: '#ffffff' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomItem}
                  className="preorder-dialog-add flex-1 px-3 py-2 rounded disabled:opacity-50"
                  style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
                  disabled={!customItemName || !customItemPrice || selectedMembers.length === 0}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
