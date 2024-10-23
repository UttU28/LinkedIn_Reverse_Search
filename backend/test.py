import socket
import psutil
import pygetwindow as gw

def is_chrome_running(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result == 0

def bring_chrome_to_front(port):
    # Iterate through all running processes
    for proc in psutil.process_iter(attrs=['pid', 'name', 'cmdline']):
        try:
            # Check if the process is Chrome
            if proc.info['name'] == 'chrome.exe':
                # Check if the command line contains the desired remote debugging port
                if f'--remote-debugging-port={port}' in proc.info['cmdline']:
                    chrome_window = gw.getWindowsWithTitle('Google Chrome')
                    for window in chrome_window:
                        # Get the process ID associated with the window
                        if proc.info['pid'] == window.processId:  # Match process ID
                            window.activate()  # Bring it to the front
                            return
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    print("Chrome window with the specified port not found.")

if __name__ == "__main__":
    port = 8989
    if is_chrome_running(port):
        print(f"Chrome is running on port {port}.")
        bring_chrome_to_front(port)
    else:
        print(f"Chrome is NOT running on port {port}.")
