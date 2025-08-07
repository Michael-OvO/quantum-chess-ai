"""
Utility functions for clean terminal output and progress tracking.
"""

import sys
import time
from typing import Optional, Dict, Any
from tqdm import tqdm


class TrainingProgress:
    """Manages training progress display with clean, minimal output."""
    
    def __init__(self, total_iterations: int, quiet: bool = False):
        self.total_iterations = total_iterations
        self.quiet = quiet
        self.current_iteration = 0
        self.start_time = time.time()
        self.metrics = {
            'games': 0,
            'positions': 0,
            'loss': 0.0,
            'lr': 0.001,
            'win_rate': 0.0,
        }
        
    def update_metrics(self, **kwargs):
        """Update training metrics."""
        self.metrics.update(kwargs)
        
    def display_status(self):
        """Display single-line status update."""
        if self.quiet:
            return
            
        elapsed = time.time() - self.start_time
        games_per_min = (self.metrics['games'] / elapsed) * 60 if elapsed > 0 else 0
        
        # Build status line
        status = (
            f"\r[{self.current_iteration}/{self.total_iterations}] "
            f"Games: {self.metrics['games']} | "
            f"Pos: {self.metrics['positions']/1000:.1f}k | "
            f"Loss: {self.metrics['loss']:.3f} | "
            f"LR: {self.metrics['lr']:.4f} | "
            f"Win%: {self.metrics['win_rate']:.1f} | "
            f"{games_per_min:.1f} g/min"
        )
        
        # Clear line and print
        sys.stdout.write('\r' + ' ' * 100)
        sys.stdout.write(status)
        sys.stdout.flush()
        
    def next_iteration(self):
        """Move to next iteration."""
        self.current_iteration += 1
        
    def finish(self):
        """Finish progress display."""
        if not self.quiet:
            print()  # New line after progress


def create_progress_bar(total: int, desc: str, unit: str = "it", 
                        disable: bool = False, leave: bool = True) -> tqdm:
    """
    Create a clean progress bar with minimal styling.
    
    Args:
        total: Total number of iterations
        desc: Description for the progress bar
        unit: Unit of iteration
        disable: Whether to disable the progress bar
        leave: Whether to leave the progress bar after completion
        
    Returns:
        tqdm progress bar instance
    """
    return tqdm(
        total=total,
        desc=desc,
        unit=unit,
        disable=disable,
        leave=leave,
        ncols=80,  # Fixed width for cleaner display
        bar_format='{desc}: {bar:30} {n_fmt}/{total_fmt} [{elapsed}<{remaining}]'
    )


def format_time(seconds: float) -> str:
    """Format time in human-readable format."""
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        return f"{seconds/60:.1f}m"
    else:
        return f"{seconds/3600:.1f}h"


def print_phase(phase: str, icon: str = ""):
    """Print a phase indicator with optional icon."""
    if icon:
        print(f"\n{icon} {phase}")
    else:
        print(f"\n{phase}")


def print_compact_config(config: Dict[str, Any]):
    """Print configuration in compact format."""
    print("\nConfiguration:")
    max_key_len = max(len(k) for k in config.keys())
    for key, value in config.items():
        print(f"  {key:<{max_key_len}} : {value}")
    print()


def suppress_error(func):
    """Decorator to suppress verbose error messages."""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            # Only print short error message
            print(f"Error: {str(e)[:100]}")
            return None
    return wrapper