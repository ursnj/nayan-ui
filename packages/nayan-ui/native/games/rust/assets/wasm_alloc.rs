//! Allocator entry points for meshoptimizer on WASM.

// meshoptimizer's minimal WASM headers use C++ new/delete without a C++ runtime. Provide them
// from Rust's allocator. Keep a 16-byte header so delete can recover the allocation layout.
#[unsafe(export_name = "_Znwm")]
pub extern "C" fn cpp_new(bytes: usize) -> *mut u8 {
    let size = bytes.max(1).checked_add(16).expect("mesh allocation overflow");
    let layout = std::alloc::Layout::from_size_align(size, 16).expect("mesh allocation layout");
    unsafe {
        let ptr = std::alloc::alloc(layout);
        if ptr.is_null() {
            std::alloc::handle_alloc_error(layout);
        }
        ptr.cast::<usize>().write(size);
        ptr.add(16)
    }
}

#[unsafe(export_name = "_ZdlPv")]
pub unsafe extern "C" fn cpp_delete(ptr: *mut u8) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        let base = ptr.sub(16);
        let size = base.cast::<usize>().read();
        std::alloc::dealloc(base, std::alloc::Layout::from_size_align_unchecked(size, 16));
    }
}
