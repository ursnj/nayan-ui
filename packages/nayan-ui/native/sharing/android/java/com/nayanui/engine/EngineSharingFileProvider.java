package com.nayanui.engine;

/** Exposes only engine-owned sharing copies, never the caller's original file tree. */
public final class EngineSharingFileProvider extends androidx.core.content.FileProvider {}
