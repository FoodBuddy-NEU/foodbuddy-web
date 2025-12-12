'use client';

import React, { useState, useMemo } from 'react';
import type { Menu } from '@/types/restaurant';
import { processRestaurantMenus } from '@/lib/menuCategorizer';

// Force recompile - all text should be white in dark mode

interface MenuCategorySelectorProps {
  menus: Menu[];
}

export default function MenuCategorySelector({ menus }: MenuCategorySelectorProps) {
  // Only auto-categorize if a single menu and its title is 'Main Menu'
  const processedMenus = useMemo(() => {
    if (menus.length === 1 && menus[0].title.trim().toLowerCase() === 'main menu') {
      return processRestaurantMenus(menus);
    }
    return menus;
  }, [menus]);

  const [selectedMenuId, setSelectedMenuId] = useState<string>(processedMenus[0]?.id || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  /**
   * Monitor theme changes on html element.
   * WHY: Dropdown colors must sync with theme mode (light/dark).
   * MutationObserver watches for 'dark' class additions/removals on <html> root.
   */
  React.useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const selectedMenu = processedMenus.find((m) => m.id === selectedMenuId) || processedMenus[0];
  const selectedMenuTitle = selectedMenu?.title || '';

  if (!selectedMenu) {
    return <div className="text-sm text-gray-600 dark:text-gray-200">No menu available</div>;
  }

  return (
    <div className="space-y-4">
      <style>{`
        #menu-category-dropdown-menu .menu-item {
          background-color: white !important;
          color: black !important;
        }
        
        #menu-category-dropdown-menu .menu-item:hover {
          background-color: #e8e8e8 !important;
          color: black !important;
        }
        
        html.dark #menu-category-dropdown-menu .menu-item {
          background-color: #1e1e1e !important;
          color: #ffffff !important;
        }
        
        html.dark #menu-category-dropdown-menu .menu-item:hover {
          background-color: #2d2d2d !important;
          color: #ffffff !important;
        }
      `}</style>

      {/* Custom Menu Category Dropdown */}
      {processedMenus.length > 1 && (
        <div className="flex items-center gap-3">
          <label htmlFor="menu-category" className="text-sm font-medium text-black dark:text-white">
            Choose a category:
          </label>
          <div className="relative">
            <button
              id="menu-category-dropdown-btn"
              onClick={() => setIsOpen(!isOpen)}
              className="px-3 py-2 rounded-lg text-sm cursor-pointer flex justify-between items-center"
              style={{
                minWidth: '200px',
                border: isDark ? '2px solid #666' : '2px solid black',
                backgroundColor: isDark ? '#1e1e1e' : 'white',
                color: isDark ? '#ffffff' : 'black',
              }}
            >
              <span>{selectedMenuTitle}</span>
              <span>{isOpen ? '▲' : '▼'}</span>
            </button>

            {/* Custom Dropdown Menu */}
            {isOpen && (
              <div
                id="menu-category-dropdown-menu"
                className="absolute top-full left-0 right-0 z-50"
                style={{
                  backgroundColor: isDark ? '#1e1e1e' : 'white',
                  borderLeft: isDark ? '2px solid #666' : '2px solid black',
                  borderRight: isDark ? '2px solid #666' : '2px solid black',
                  borderBottom: isDark ? '2px solid #666' : '2px solid black',
                  borderRadius: '0 0 8px 8px',
                }}
              >
                {processedMenus.map((menu) => (
                  <button
                    key={menu.id}
                    onClick={() => {
                      setSelectedMenuId(menu.id);
                      setIsOpen(false);
                    }}
                    className="menu-dropdown-item"
                    style={
                      {
                        backgroundColor:
                          selectedMenuId === menu.id
                            ? isDark
                              ? '#2d2d2d'
                              : '#e8e8e8'
                            : isDark
                              ? '#1e1e1e'
                              : 'white',
                        color: isDark ? '#ffffff' : 'black',
                        width: '100%',
                        padding: '8px 12px',
                        textAlign: 'left',
                        display: 'block',
                        border: 'none',
                        borderBottom: isDark ? '1px solid #333' : '1px solid #e0e0e0',
                        cursor: 'pointer',
                        fontSize: '14px',
                      } as React.CSSProperties
                    }
                    onMouseEnter={(e) => {
                      const btn = e.target as HTMLButtonElement;
                      btn.style.setProperty(
                        'background-color',
                        isDark ? '#2d2d2d' : '#e8e8e8',
                        'important'
                      );
                      btn.style.setProperty('color', isDark ? '#ffffff' : 'black', 'important');
                    }}
                    onMouseLeave={(e) => {
                      const btn = e.target as HTMLButtonElement;
                      const bgColor =
                        selectedMenuId === menu.id
                          ? isDark
                            ? '#2d2d2d'
                            : '#e8e8e8'
                          : isDark
                            ? '#1e1e1e'
                            : 'white';
                      btn.style.setProperty('background-color', bgColor, 'important');
                      btn.style.setProperty('color', isDark ? '#ffffff' : 'black', 'important');
                    }}
                  >
                    {menu.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div>
        <h3 className="font-semibold text-lg mb-3">{selectedMenu.title}</h3>
        <div className="space-y-3">
          {selectedMenu.items.map((item) => (
            <div
              key={item.id}
              className="menu-item-card flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-colors"
            >
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-sm font-semibold text-gray-700 dark:text-white">
                ${item.price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
