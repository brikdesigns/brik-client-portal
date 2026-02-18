'use client';

import { useState, useRef, useEffect } from 'react';
import { setCurrentClientIdInBrowser } from '@/lib/current-client-browser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCheck, faBuilding } from '@fortawesome/free-solid-svg-icons';

interface ClientSwitcherProps {
  clients: Array<{ id: string; name: string }>;
  currentClientId: string | null;
  isAdmin: boolean;
}

export function ClientSwitcher({ clients, currentClientId, isAdmin }: ClientSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentClient = clients.find((c) => c.id === currentClientId);
  const displayName = currentClient?.name || 'Select Client';

  function handleClientSwitch(clientId: string | null) {
    if (clientId === null) {
      // Clear cookie and redirect to admin
      document.cookie = 'current_client_id=; max-age=0; path=/';
      window.location.href = '/admin';
    } else {
      setCurrentClientIdInBrowser(clientId);
      window.location.reload();
    }
  }

  if (clients.length === 0) {
    return null;
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: 'var(--_color---surface--secondary)',
          border: '1px solid var(--_color---border--secondary)',
          borderRadius: '6px',
          fontFamily: 'var(--_typography---font-family--body)',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--_color---text--primary)',
          cursor: 'pointer',
          transition: 'background-color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--_color---border--primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--_color---border--secondary)';
        }}
      >
        <FontAwesomeIcon icon={faBuilding} style={{ fontSize: '12px' }} />
        <span>{displayName}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          style={{
            fontSize: '10px',
            transition: 'transform 0.15s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 4px)',
            left: 0,
            minWidth: '200px',
            maxHeight: '300px',
            overflowY: 'auto',
            backgroundColor: 'var(--_color---surface--primary)',
            border: '1px solid var(--_color---border--secondary)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '4px 0',
            zIndex: 1000,
          }}
        >
          {/* Admin "All Clients" option */}
          {isAdmin && (
            <>
              <button
                onClick={() => handleClientSwitch(null)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: currentClientId === null ? 'var(--_color---page--secondary)' : 'transparent',
                  border: 'none',
                  fontFamily: 'var(--_typography---font-family--body)',
                  fontSize: '13px',
                  fontWeight: currentClientId === null ? 600 : 400,
                  color: 'var(--_color---text--primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (currentClientId !== null) {
                    e.currentTarget.style.backgroundColor = 'var(--_color---page--secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentClientId !== null) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>All Clients (Admin)</span>
                {currentClientId === null && (
                  <FontAwesomeIcon icon={faCheck} style={{ fontSize: '12px', color: 'var(--_color---text--brand)' }} />
                )}
              </button>
              <div
                style={{
                  height: '1px',
                  backgroundColor: 'var(--_color---border--secondary)',
                  margin: '4px 0',
                }}
              />
            </>
          )}

          {/* Client list */}
          {clients.map((client) => {
            const isCurrent = client.id === currentClientId;
            return (
              <button
                key={client.id}
                onClick={() => handleClientSwitch(client.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: isCurrent ? 'var(--_color---page--secondary)' : 'transparent',
                  border: 'none',
                  fontFamily: 'var(--_typography---font-family--body)',
                  fontSize: '13px',
                  fontWeight: isCurrent ? 600 : 400,
                  color: 'var(--_color---text--primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.backgroundColor = 'var(--_color---page--secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{client.name}</span>
                {isCurrent && (
                  <FontAwesomeIcon icon={faCheck} style={{ fontSize: '12px', color: 'var(--_color---text--brand)' }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
